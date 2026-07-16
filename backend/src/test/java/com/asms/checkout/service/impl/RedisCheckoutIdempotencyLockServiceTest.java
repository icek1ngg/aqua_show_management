package com.asms.checkout.service.impl;

import com.asms.core.exception.ConflictException;
import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.ServiceUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisCheckoutIdempotencyLockServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RedisCheckoutIdempotencyLockService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new RedisCheckoutIdempotencyLockService(
                redisTemplate,
                Duration.ofSeconds(60),
                Duration.ofMillis(8),
                Duration.ofMillis(1)
        );
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void executesActionAndReleasesOnlyTheOwnedLock() {
        when(valueOperations.setIfAbsent(any(), any(), eq(Duration.ofSeconds(60)))).thenReturn(true);
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(1L);
        AtomicBoolean executed = new AtomicBoolean();

        String result = service.execute(
                UUID.fromString("b7fb2c68-e22d-4ccd-99a8-571c98cf87bf"),
                "retry-key",
                () -> {
                    executed.set(true);
                    return "created";
                }
        );

        assertThat(result).isEqualTo("created");
        assertThat(executed).isTrue();

        ArgumentCaptor<String> lockKey = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> owner = ArgumentCaptor.forClass(String.class);
        verify(valueOperations).setIfAbsent(lockKey.capture(), owner.capture(), eq(Duration.ofSeconds(60)));
        assertThat(lockKey.getValue())
                .startsWith("checkout:idempotency:{b7fb2c68-e22d-4ccd-99a8-571c98cf87bf}:")
                .doesNotContain("retry-key");
        assertThat(lockKey.getValue().substring(lockKey.getValue().lastIndexOf(':') + 1)).hasSize(64);

        ArgumentCaptor<RedisScript> releaseScript = ArgumentCaptor.forClass(RedisScript.class);
        verify(redisTemplate).execute(releaseScript.capture(), eq(List.of(lockKey.getValue())), eq(owner.getValue()));
        assertThat(releaseScript.getValue().getScriptAsString()).contains("GET", "DEL", "ARGV[1]");
    }

    @Test
    void timeoutMapsToStableCheckoutInProgressConflict() {
        when(valueOperations.setIfAbsent(any(), any(), any(Duration.class))).thenReturn(false);

        assertThatThrownBy(() -> service.execute(UUID.randomUUID(), "busy-key", () -> "never"))
                .isInstanceOfSatisfying(ConflictException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.CHECKOUT_IN_PROGRESS);
                    assertThat(exception.getStatus().value()).isEqualTo(409);
                });
    }

    @Test
    void redisAcquisitionFailureMapsToServiceUnavailable() {
        when(valueOperations.setIfAbsent(any(), any(), any(Duration.class)))
                .thenThrow(new DataAccessResourceFailureException("Redis offline"));

        assertThatThrownBy(() -> service.execute(UUID.randomUUID(), "key", () -> "never"))
                .isInstanceOfSatisfying(ServiceUnavailableException.class,
                        exception -> assertThat(exception.getStatus().value()).isEqualTo(503));
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void actionFailureStillReleasesTheOwnedLock() {
        when(valueOperations.setIfAbsent(any(), any(), any(Duration.class))).thenReturn(true);
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(1L);

        assertThatThrownBy(() -> service.execute(UUID.randomUUID(), "key", () -> {
            throw new IllegalStateException("action failed");
        })).isInstanceOf(IllegalStateException.class).hasMessage("action failed");

        verify(redisTemplate).execute(any(RedisScript.class), anyList(), any(Object[].class));
    }
}
