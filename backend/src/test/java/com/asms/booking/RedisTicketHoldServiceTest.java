package com.asms.booking;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisTicketHoldServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private HashOperations<String, Object, Object> hashOperations;
    private Object holdService;

    @BeforeEach
    void setUp() throws Exception {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        hashOperations = mock(HashOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        holdService = newHoldService(redisTemplate);
    }

    @Test
    void holdTicketsReturnsSuccessWhenRedisScriptSucceeds() throws Exception {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of("1", "hold-123", "2026-05-31T15:15:00Z"));

        Object result = invoke(
                holdService,
                "holdTickets",
                new Class<?>[]{String.class, String.class, int.class, UUID.class},
                "schedule-1",
                "Standard Entry",
                2,
                UUID.randomUUID()
        );

        assertThat(invoke(result, "success")).isEqualTo(true);
        assertThat(invoke(result, "holdId")).isEqualTo("hold-123");
        assertThat(invoke(result, "message")).isEqualTo("Tickets held successfully");
        assertThat(invoke(result, "expiresAt")).isEqualTo(Instant.parse("2026-05-31T15:15:00Z"));
    }

    @Test
    void holdTicketsReturnsFailureWhenInventoryIsInsufficient() throws Exception {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(List.of("0", "", ""));

        Object result = invoke(
                holdService,
                "holdTickets",
                new Class<?>[]{String.class, String.class, int.class, UUID.class},
                "schedule-1",
                "VIP Entry",
                10,
                UUID.randomUUID()
        );

        assertThat(invoke(result, "success")).isEqualTo(false);
        assertThat(invoke(result, "holdId")).isNull();
        assertThat(invoke(result, "message")).isEqualTo("Insufficient ticket inventory");
    }

    @Test
    void releaseHoldUsesAtomicScriptToDecrementHeldCountAndDeleteHold() throws Exception {
        invoke(holdService, "releaseHold", new Class<?>[]{String.class}, "hold-123");

        ArgumentCaptor<List<String>> keysCaptor = ArgumentCaptor.forClass(List.class);
        verify(redisTemplate).execute(any(RedisScript.class), keysCaptor.capture(), anyString());

        assertThat(keysCaptor.getValue()).containsExactly("booking:hold:hold-123");
    }

    @Test
    void missingHoldReturnsInvalid() throws Exception {
        when(hashOperations.entries("booking:hold:missing")).thenReturn(Map.of());

        Object hold = invoke(holdService, "getHold", new Class<?>[]{String.class}, "missing");
        Object valid = invoke(holdService, "isHoldValid", new Class<?>[]{String.class}, "missing");

        assertThat((Optional<?>) hold).isEmpty();
        assertThat(valid).isEqualTo(false);
    }

    @Test
    void redisExceptionIsWrappedClearly() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new RedisConnectionFailureException("redis down"));

        assertThatThrownBy(() -> invoke(
                holdService,
                "holdTickets",
                new Class<?>[]{String.class, String.class, int.class, UUID.class},
                "schedule-1",
                "Standard Entry",
                1,
                UUID.randomUUID()
        ))
                .isInstanceOf(Exception.class)
                .hasRootCauseMessage("Ticket hold service is temporarily unavailable");
    }

    private Object newHoldService(StringRedisTemplate redisTemplate) throws Exception {
        Constructor<?> constructor = Class.forName("com.asms.booking.service.impl.RedisTicketHoldServiceImpl")
                .getConstructor(StringRedisTemplate.class);
        return constructor.newInstance(redisTemplate);
    }

    private Object invoke(Object target, String methodName) throws Exception {
        return invoke(target, methodName, new Class<?>[]{});
    }

    private Object invoke(Object target, String methodName, Class<?>[] parameterTypes, Object... values) throws Exception {
        Method method = target.getClass().getMethod(methodName, parameterTypes);
        return method.invoke(target, values);
    }
}
