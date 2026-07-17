package com.asms.booking;

import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.booking.enums.TicketType;
import com.asms.booking.exception.TicketHoldServiceUnavailableException;
import com.asms.booking.service.impl.RedisTicketHoldServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisTicketHoldServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private HashOperations<String, Object, Object> hashOperations;
    private RedisTicketHoldServiceImpl service;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        hashOperations = mock(HashOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        service = new RedisTicketHoldServiceImpl(redisTemplate);
    }

    @Test
    void inventoryKeyIncludesScheduleAndTicketType() {
        assertThat(service.inventoryKey("schedule-1", TicketType.VIP))
                .isEqualTo("booking:inventory:schedule-1:VIP");
    }

    @Test
    void initializeInventoryUsesScheduleAndTicketTypeKey() {
        service.initializeInventory("schedule-1", TicketType.STANDARD, 7);

        verify(valueOperations).set("booking:inventory:schedule-1:STANDARD", "7");
    }

    @Test
    void holdTicketsReturnsRemainingEffectiveAvailability() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class)))
                .thenReturn(List.of("1", "hold-123", "7", "2026-07-13T15:15:00Z"));

        HoldResult result = service.holdTickets(
                "schedule-1", TicketType.VIP, 3, UUID.randomUUID());

        assertThat(result.success()).isTrue();
        assertThat(result.holdId()).isEqualTo("hold-123");
        assertThat(result.expiresAt()).isEqualTo(Instant.parse("2026-07-13T15:15:00Z"));
        assertThat(result.remainingAvailable()).isEqualTo(7);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> keys = ArgumentCaptor.forClass(List.class);
        verify(redisTemplate).execute(any(RedisScript.class), keys.capture(), any(Object[].class));
        assertThat(keys.getValue().get(0)).isEqualTo("booking:inventory:schedule-1:VIP");
        assertThat(keys.getValue().get(1)).startsWith("booking:hold:");
        assertThat(keys.getValue().get(2)).isEqualTo("booking:active-holds:schedule-1:VIP");
    }

    @Test
    void effectiveAvailabilityRemovesOnlyExpiredHoldAndCountsActiveHoldInRealRedis() {
        String host = System.getenv().getOrDefault("REDIS_TEST_HOST", "localhost");
        int port = Integer.parseInt(System.getenv().getOrDefault("REDIS_TEST_PORT", "6379"));
        LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(host, port);
        connectionFactory.afterPropertiesSet();
        connectionFactory.start();
        StringRedisTemplate realRedis = new StringRedisTemplate(connectionFactory);
        realRedis.afterPropertiesSet();

        String scheduleId = "redis-hold-test-" + UUID.randomUUID();
        String inventoryKey = "booking:inventory:" + scheduleId + ":FAMILY";
        String activeHoldsKey = "booking:active-holds:" + scheduleId + ":FAMILY";
        String expiredHoldId = "expired-" + UUID.randomUUID();
        String activeHoldId = "active-" + UUID.randomUUID();
        String expiredHoldKey = "booking:hold:" + expiredHoldId;
        String activeHoldKey = "booking:hold:" + activeHoldId;
        long now = Instant.now().getEpochSecond();

        try {
            realRedis.opsForHash().putAll(expiredHoldKey, Map.of("quantity", "4"));
            realRedis.opsForHash().putAll(activeHoldKey, Map.of("quantity", "3"));
            realRedis.opsForZSet().add(activeHoldsKey, expiredHoldId, now - 60);
            realRedis.opsForZSet().add(activeHoldsKey, activeHoldId, now + 600);

            RedisTicketHoldServiceImpl realService = new RedisTicketHoldServiceImpl(realRedis);
            int available = realService.effectiveAvailability(scheduleId, TicketType.FAMILY, 10);

            assertThat(available).isEqualTo(7);
            assertThat(realRedis.hasKey(expiredHoldKey)).isFalse();
            assertThat(realRedis.opsForZSet().score(activeHoldsKey, expiredHoldId)).isNull();
            assertThat(realRedis.hasKey(activeHoldKey)).isTrue();
            assertThat(realRedis.opsForZSet().score(activeHoldsKey, activeHoldId)).isNotNull();
        } finally {
            realRedis.delete(List.of(inventoryKey, activeHoldsKey, expiredHoldKey, activeHoldKey));
            connectionFactory.destroy();
        }
    }

    @Test
    void holdTicketsReturnsFailureWhenInventoryIsInsufficient() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class)))
                .thenReturn(List.of("0", "", "4", ""));

        HoldResult result = service.holdTickets(
                "schedule-1", TicketType.VIP, 10, UUID.randomUUID());

        assertThat(result.success()).isFalse();
        assertThat(result.holdId()).isNull();
        assertThat(result.remainingAvailable()).isEqualTo(4);
    }

    @Test
    void releaseHoldDeletesHashAndRemovesMemberFromItsTypedActiveSet() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class)))
                .thenReturn(1L);

        service.releaseHold("hold-123");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<RedisScript<Long>> script = ArgumentCaptor.forClass(RedisScript.class);
        verify(redisTemplate).execute(script.capture(), anyList(), any(Object[].class));
        assertThat(script.getValue().getScriptAsString()).contains("ZREM", "DEL");
    }

    @Test
    void missingHoldReturnsInvalid() {
        when(hashOperations.entries("booking:hold:missing")).thenReturn(Map.of());

        Optional<?> hold = service.getHold("missing");

        assertThat(hold).isEmpty();
        assertThat(service.isHoldValid("missing")).isFalse();
    }

    @Test
    void redisExceptionIsWrappedClearlyForCheckout() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class)))
                .thenThrow(new RedisConnectionFailureException("redis down"));

        assertThatThrownBy(() -> service.holdTickets(
                "schedule-1", TicketType.STANDARD, 1, UUID.randomUUID()))
                .isInstanceOf(TicketHoldServiceUnavailableException.class)
                .hasMessage("Ticket hold service is temporarily unavailable");
    }
}
