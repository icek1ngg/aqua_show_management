package com.asms.checkout.service.impl;

import com.asms.checkout.service.CheckoutIdempotencyLockService;
import com.asms.core.exception.ConflictException;
import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.ServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;
import jakarta.annotation.PreDestroy;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

@Service
public class RedisCheckoutIdempotencyLockService implements CheckoutIdempotencyLockService {

    private static final Logger log = LoggerFactory.getLogger(RedisCheckoutIdempotencyLockService.class);
    private static final Duration DEFAULT_LEASE = Duration.ofSeconds(60);
    private static final Duration DEFAULT_WAIT = Duration.ofSeconds(5);
    private static final Duration DEFAULT_RETRY_DELAY = Duration.ofMillis(50);
    private static final RedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>(
            """
            if redis.call('GET', KEYS[1]) == ARGV[1] then
              return redis.call('DEL', KEYS[1])
            end
            return 0
            """,
            Long.class
    );
    private static final RedisScript<Long> RENEW_SCRIPT = new DefaultRedisScript<>(
            """
            if redis.call('GET', KEYS[1]) == ARGV[1] then
              return redis.call('PEXPIRE', KEYS[1], ARGV[2])
            end
            return 0
            """,
            Long.class
    );

    private final StringRedisTemplate redisTemplate;
    private final Duration lease;
    private final Duration wait;
    private final Duration retryDelay;
    private final Duration renewalInterval;
    private final ScheduledThreadPoolExecutor renewalExecutor;
    private final AtomicBoolean closed = new AtomicBoolean();

    public RedisCheckoutIdempotencyLockService(StringRedisTemplate redisTemplate) {
        this(redisTemplate, DEFAULT_LEASE, DEFAULT_WAIT, DEFAULT_RETRY_DELAY);
    }

    RedisCheckoutIdempotencyLockService(
            StringRedisTemplate redisTemplate,
            Duration lease,
            Duration wait,
            Duration retryDelay
    ) {
        this(redisTemplate, lease, wait, retryDelay, Duration.ofNanos(Math.max(1, lease.toNanos() / 3)));
    }

    RedisCheckoutIdempotencyLockService(
            StringRedisTemplate redisTemplate,
            Duration lease,
            Duration wait,
            Duration retryDelay,
            Duration renewalInterval
    ) {
        this.redisTemplate = redisTemplate;
        this.lease = lease;
        this.wait = wait;
        this.retryDelay = retryDelay;
        this.renewalInterval = renewalInterval;
        this.renewalExecutor = (ScheduledThreadPoolExecutor) Executors.newScheduledThreadPool(2, runnable -> {
            Thread thread = new Thread(runnable, "checkout-lock-renewal");
            thread.setDaemon(true);
            return thread;
        });
        this.renewalExecutor.setRemoveOnCancelPolicy(true);
        this.renewalExecutor.setContinueExistingPeriodicTasksAfterShutdownPolicy(true);
    }

    @Override
    public <T> T execute(UUID userId, String idempotencyKey, Supplier<T> action) {
        if (closed.get()) {
            throw unavailable();
        }
        String lockKey = lockKey(userId, idempotencyKey);
        String owner = UUID.randomUUID().toString();
        long deadline = System.nanoTime() + wait.toNanos();

        while (!tryAcquire(lockKey, owner)) {
            if (closed.get()) {
                throw unavailable();
            }
            if (System.nanoTime() >= deadline) {
                throw new ConflictException(
                        ErrorCode.CHECKOUT_IN_PROGRESS,
                        "Checkout is already in progress. Please try again shortly."
                );
            }
            pauseBeforeRetry();
        }

        LeaseWatchdog watchdog;
        try {
            watchdog = startWatchdog(lockKey, owner);
        } catch (RuntimeException startFailure) {
            try {
                release(lockKey, owner);
            } catch (RuntimeException releaseFailure) {
                startFailure.addSuppressed(releaseFailure);
            }
            throw startFailure;
        }
        RuntimeException actionFailure = null;
        T result;
        try {
            result = action.get();
        } catch (RuntimeException exception) {
            actionFailure = exception;
            throw exception;
        } finally {
            watchdog.stop();
            if (actionFailure != null && watchdog.failure() != null) {
                actionFailure.addSuppressed(watchdog.failure());
            }
            try {
                release(lockKey, owner);
            } catch (RuntimeException releaseFailure) {
                if (actionFailure != null) {
                    actionFailure.addSuppressed(releaseFailure);
                } else {
                    throw releaseFailure;
                }
            }
        }
        if (watchdog.failure() != null) {
            throw watchdog.failure();
        }
        return result;
    }

    private LeaseWatchdog startWatchdog(String lockKey, String owner) {
        if (closed.get()) {
            throw unavailable();
        }
        LeaseWatchdog watchdog = new LeaseWatchdog(lockKey, owner);
        ScheduledFuture<?> future;
        try {
            future = renewalExecutor.scheduleAtFixedRate(
                    watchdog::renew,
                    renewalInterval.toNanos(),
                    renewalInterval.toNanos(),
                    TimeUnit.NANOSECONDS
            );
        } catch (RejectedExecutionException exception) {
            ServiceUnavailableException unavailable = unavailable();
            unavailable.addSuppressed(exception);
            throw unavailable;
        }
        watchdog.attach(future);
        if (closed.get()) {
            watchdog.stop();
            throw unavailable();
        }
        return watchdog;
    }

    private boolean tryAcquire(String lockKey, String owner) {
        try {
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, owner, lease);
            if (acquired == null) {
                throw unavailable();
            }
            return acquired;
        } catch (DataAccessException exception) {
            log.error("Redis checkout idempotency lock acquisition failed: key={}", lockKey, exception);
            throw unavailable();
        }
    }

    private void release(String lockKey, String owner) {
        try {
            redisTemplate.execute(RELEASE_SCRIPT, List.of(lockKey), owner);
        } catch (DataAccessException exception) {
            log.error("Redis checkout idempotency lock release failed: key={}", lockKey, exception);
            throw unavailable();
        }
    }

    private void pauseBeforeRetry() {
        try {
            Thread.sleep(retryDelay.toMillis(), retryDelay.toNanosPart() % 1_000_000);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable();
        }
    }

    private String lockKey(UUID userId, String idempotencyKey) {
        return "checkout:idempotency:{" + userId + "}:" + digest(idempotencyKey);
    }

    private String digest(String value) {
        try {
            byte[] hashed = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private ServiceUnavailableException unavailable() {
        return new ServiceUnavailableException("Checkout coordination service is temporarily unavailable");
    }

    @PreDestroy
    public void close() {
        if (closed.compareAndSet(false, true)) {
            renewalExecutor.shutdown();
        }
    }

    private final class LeaseWatchdog {
        private final String lockKey;
        private final String owner;
        private final AtomicReference<ServiceUnavailableException> failure = new AtomicReference<>();
        private ScheduledFuture<?> future;

        private LeaseWatchdog(String lockKey, String owner) {
            this.lockKey = lockKey;
            this.owner = owner;
        }

        private synchronized void attach(ScheduledFuture<?> future) {
            this.future = future;
        }

        private synchronized void renew() {
            if (failure.get() != null) {
                return;
            }
            try {
                Long renewed = redisTemplate.execute(
                        RENEW_SCRIPT,
                        List.of(lockKey),
                        owner,
                        String.valueOf(lease.toMillis())
                );
                if (renewed == null) {
                    loseOwnership("Checkout lock renewal returned no result", null);
                } else if (renewed != 1L) {
                    loseOwnership("Checkout lock ownership was lost", null);
                }
            } catch (DataAccessException exception) {
                loseOwnership("Redis checkout lock renewal failed", exception);
            }
        }

        private synchronized void stop() {
            if (future != null) {
                future.cancel(false);
            }
        }

        private ServiceUnavailableException failure() {
            return failure.get();
        }

        private void loseOwnership(String reason, Exception cause) {
            ServiceUnavailableException lost = new ServiceUnavailableException(
                    "Checkout coordination service lost lock ownership"
            );
            if (failure.compareAndSet(null, lost)) {
                if (cause == null) {
                    log.warn("{}: key={}", reason, lockKey);
                } else {
                    log.error("{}: key={}", reason, lockKey, cause);
                }
            }
        }
    }
}
