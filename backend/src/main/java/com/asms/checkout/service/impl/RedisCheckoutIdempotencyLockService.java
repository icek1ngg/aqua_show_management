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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
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

    private final StringRedisTemplate redisTemplate;
    private final Duration lease;
    private final Duration wait;
    private final Duration retryDelay;

    public RedisCheckoutIdempotencyLockService(StringRedisTemplate redisTemplate) {
        this(redisTemplate, DEFAULT_LEASE, DEFAULT_WAIT, DEFAULT_RETRY_DELAY);
    }

    RedisCheckoutIdempotencyLockService(
            StringRedisTemplate redisTemplate,
            Duration lease,
            Duration wait,
            Duration retryDelay
    ) {
        this.redisTemplate = redisTemplate;
        this.lease = lease;
        this.wait = wait;
        this.retryDelay = retryDelay;
    }

    @Override
    public <T> T execute(UUID userId, String idempotencyKey, Supplier<T> action) {
        String lockKey = lockKey(userId, idempotencyKey);
        String owner = UUID.randomUUID().toString();
        long deadline = System.nanoTime() + wait.toNanos();

        while (!tryAcquire(lockKey, owner)) {
            if (System.nanoTime() >= deadline) {
                throw new ConflictException(
                        ErrorCode.CHECKOUT_IN_PROGRESS,
                        "Checkout is already in progress. Please try again shortly."
                );
            }
            pauseBeforeRetry();
        }

        try {
            return action.get();
        } finally {
            release(lockKey, owner);
        }
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
}
