package com.asms.checkout.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@EnabledIfEnvironmentVariable(named = "RUN_REDIS_INTEGRATION", matches = "true")
class RedisCheckoutIdempotencyLockServiceIntegrationTest {

    @Test
    void renewalKeepsSlowCheckoutExclusiveAndRetryRehydratesCommittedState() throws Exception {
        String host = System.getenv().getOrDefault("REDIS_TEST_HOST", "host.docker.internal");
        int port = Integer.parseInt(System.getenv().getOrDefault("REDIS_TEST_PORT", "6379"));
        LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(host, port);
        connectionFactory.afterPropertiesSet();
        connectionFactory.start();
        StringRedisTemplate redis = new StringRedisTemplate(connectionFactory);
        redis.afterPropertiesSet();
        RedisCheckoutIdempotencyLockService service = new RedisCheckoutIdempotencyLockService(
                redis,
                Duration.ofSeconds(1),
                Duration.ofSeconds(5),
                Duration.ofMillis(10),
                Duration.ofMillis(100)
        );
        ExecutorService requests = Executors.newFixedThreadPool(2);
        UUID userId = UUID.randomUUID();
        String idempotencyKey = "live-renewal-" + UUID.randomUUID();
        AtomicReference<String> committedBooking = new AtomicReference<>();
        AtomicInteger providerSideEffects = new AtomicInteger();
        AtomicInteger activeCriticalSections = new AtomicInteger();
        AtomicInteger maxActiveCriticalSections = new AtomicInteger();
        CountDownLatch firstEntered = new CountDownLatch(1);

        try {
            Future<String> first = requests.submit(() -> service.execute(userId, idempotencyKey, () -> {
                enterCriticalSection(activeCriticalSections, maxActiveCriticalSections);
                try {
                    providerSideEffects.incrementAndGet();
                    firstEntered.countDown();
                    Thread.sleep(2_500);
                    committedBooking.set("booking-created");
                    return committedBooking.get();
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                } finally {
                    activeCriticalSections.decrementAndGet();
                }
            }));

            assertThat(firstEntered.await(10, TimeUnit.SECONDS)).isTrue();
            Future<String> retry = requests.submit(() -> service.execute(userId, idempotencyKey, () -> {
                enterCriticalSection(activeCriticalSections, maxActiveCriticalSections);
                try {
                    String existing = committedBooking.get();
                    if (existing == null) {
                        providerSideEffects.incrementAndGet();
                        return "duplicate-created";
                    }
                    return existing;
                } finally {
                    activeCriticalSections.decrementAndGet();
                }
            }));

            assertThat(first.get(10, TimeUnit.SECONDS)).isEqualTo("booking-created");
            assertThat(retry.get(10, TimeUnit.SECONDS)).isEqualTo("booking-created");
            assertThat(maxActiveCriticalSections).hasValue(1);
            assertThat(providerSideEffects).hasValue(1);
        } finally {
            service.close();
            requests.shutdownNow();
            Set<String> keys = redis.keys("checkout:idempotency:{" + userId + "}:*");
            if (keys != null && !keys.isEmpty()) {
                redis.delete(keys);
            }
            connectionFactory.destroy();
        }
    }

    @Test
    void losingOwnershipDoesNotDeleteTheNewOwnersLock() throws Exception {
        String host = System.getenv().getOrDefault("REDIS_TEST_HOST", "host.docker.internal");
        int port = Integer.parseInt(System.getenv().getOrDefault("REDIS_TEST_PORT", "6379"));
        LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(host, port);
        connectionFactory.afterPropertiesSet();
        connectionFactory.start();
        StringRedisTemplate redis = new StringRedisTemplate(connectionFactory);
        redis.afterPropertiesSet();
        RedisCheckoutIdempotencyLockService service = new RedisCheckoutIdempotencyLockService(
                redis,
                Duration.ofSeconds(1),
                Duration.ofSeconds(2),
                Duration.ofMillis(10),
                Duration.ofMillis(50)
        );
        ExecutorService request = Executors.newSingleThreadExecutor();
        UUID userId = UUID.randomUUID();
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch finish = new CountDownLatch(1);
        AtomicReference<String> lockKey = new AtomicReference<>();

        try {
            Future<String> checkout = request.submit(() -> service.execute(userId, "owner-loss", () -> {
                entered.countDown();
                try {
                    if (!finish.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("test did not release action");
                    }
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                }
                return "should-not-succeed";
            }));

            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
            Set<String> keys = redis.keys("checkout:idempotency:{" + userId + "}:*");
            assertThat(keys).hasSize(1);
            lockKey.set(keys.iterator().next());
            redis.opsForValue().set(lockKey.get(), "new-owner", Duration.ofSeconds(10));
            Thread.sleep(200);
            finish.countDown();

            assertThatThrownBy(() -> checkout.get(5, TimeUnit.SECONDS))
                    .isInstanceOf(ExecutionException.class)
                    .hasCauseInstanceOf(com.asms.core.exception.ServiceUnavailableException.class);
            assertThat(redis.opsForValue().get(lockKey.get())).isEqualTo("new-owner");
        } finally {
            finish.countDown();
            service.close();
            request.shutdownNow();
            if (lockKey.get() != null) {
                redis.delete(lockKey.get());
            }
            connectionFactory.destroy();
        }
    }

    private void enterCriticalSection(AtomicInteger active, AtomicInteger maxActive) {
        int current = active.incrementAndGet();
        maxActive.accumulateAndGet(current, Math::max);
    }
}
