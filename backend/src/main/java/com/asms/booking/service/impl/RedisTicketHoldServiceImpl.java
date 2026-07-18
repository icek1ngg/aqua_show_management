package com.asms.booking.service.impl;

import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.booking.dto.TicketHoldDtos.TicketHoldInfo;
import com.asms.booking.enums.TicketType;
import com.asms.booking.exception.TicketHoldServiceUnavailableException;
import com.asms.booking.service.RedisTicketHoldService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class RedisTicketHoldServiceImpl implements RedisTicketHoldService {

    private static final Logger log = LoggerFactory.getLogger(RedisTicketHoldServiceImpl.class);
    private static final Duration HOLD_TTL = Duration.ofMinutes(15);
    private static final Duration ACTIVE_HOLDS_INDEX_GRACE = Duration.ofMinutes(5);
    private static final String INVENTORY_PREFIX = "booking:inventory:";
    private static final String HOLD_PREFIX = "booking:hold:";
    private static final String ACTIVE_HOLDS_PREFIX = "booking:active-holds:";

    private static final RedisScript<List> HOLD_SCRIPT = new DefaultRedisScript<>(
            """
            local expired = redis.call('ZRANGEBYSCORE', KEYS[3], '-inf', ARGV[9])
            for _, holdId in ipairs(expired) do
              redis.call('DEL', ARGV[10] .. holdId)
            end
            redis.call('ZREMRANGEBYSCORE', KEYS[3], '-inf', ARGV[9])

            local activeHeld = 0
            local active = redis.call('ZRANGE', KEYS[3], 0, -1)
            for _, holdId in ipairs(active) do
              local quantity = redis.call('HGET', ARGV[10] .. holdId, 'quantity')
              if quantity then
                activeHeld = activeHeld + tonumber(quantity)
              else
                redis.call('ZREM', KEYS[3], holdId)
              end
            end

            local inventory = tonumber(redis.call('GET', KEYS[1]) or '0')
            local requested = tonumber(ARGV[1])
            local available = inventory - activeHeld
            if available < requested then
              return {'0', '', tostring(math.max(0, available)), ''}
            end

            redis.call('HSET', KEYS[2],
              'holdId', ARGV[2],
              'scheduleId', ARGV[3],
              'ticketType', ARGV[4],
              'quantity', ARGV[1],
              'userId', ARGV[5],
              'createdAt', ARGV[6],
              'expiresAt', ARGV[7])
            redis.call('EXPIRE', KEYS[2], tonumber(ARGV[8]))
            redis.call('ZADD', KEYS[3], tonumber(ARGV[11]), ARGV[2])
            local latest = redis.call('ZRANGE', KEYS[3], -1, -1, 'WITHSCORES')
            if #latest == 2 then
              redis.call('EXPIREAT', KEYS[3], tonumber(latest[2]) + tonumber(ARGV[12]))
            end
            return {'1', ARGV[2], tostring(available - requested), ARGV[7]}
            """,
            List.class
    );

    private static final RedisScript<Long> AVAILABLE_SCRIPT = new DefaultRedisScript<>(
            """
            local expired = redis.call('ZRANGEBYSCORE', KEYS[2], '-inf', ARGV[1])
            for _, holdId in ipairs(expired) do
              redis.call('DEL', ARGV[2] .. holdId)
            end
            redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', ARGV[1])

            local activeHeld = 0
            local active = redis.call('ZRANGE', KEYS[2], 0, -1)
            for _, holdId in ipairs(active) do
              local quantity = redis.call('HGET', ARGV[2] .. holdId, 'quantity')
              if quantity then
                activeHeld = activeHeld + tonumber(quantity)
              else
                redis.call('ZREM', KEYS[2], holdId)
              end
            end
            local latest = redis.call('ZRANGE', KEYS[2], -1, -1, 'WITHSCORES')
            if #latest == 2 then
              redis.call('EXPIREAT', KEYS[2], tonumber(latest[2]) + tonumber(ARGV[3]))
            else
              redis.call('DEL', KEYS[2])
            end
            local inventory = tonumber(redis.call('GET', KEYS[1]) or '0')
            return math.max(0, inventory - activeHeld)
            """,
            Long.class
    );

    private static final RedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>(
            """
            local scheduleId = redis.call('HGET', KEYS[1], 'scheduleId')
            local ticketType = redis.call('HGET', KEYS[1], 'ticketType')
            if not scheduleId or not ticketType then
              return 0
            end
            local activeKey = ARGV[1] .. scheduleId .. ':' .. ticketType
            redis.call('ZREM', activeKey, ARGV[2])
            redis.call('DEL', KEYS[1])
            local latest = redis.call('ZRANGE', activeKey, -1, -1, 'WITHSCORES')
            if #latest == 2 then
              redis.call('EXPIREAT', activeKey, tonumber(latest[2]) + tonumber(ARGV[3]))
            else
              redis.call('DEL', activeKey)
            end
            return 1
            """,
            Long.class
    );

    private final StringRedisTemplate redisTemplate;

    public RedisTicketHoldServiceImpl(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void initializeInventory(String scheduleId, String ticketType, Integer availableTickets) {
        initializeInventory(scheduleId, TicketType.parse(ticketType), availableTickets);
    }

    @Override
    public void initializeInventory(String scheduleId, TicketType type, int availableTickets) {
        if (availableTickets < 0) {
            throw new IllegalArgumentException("Available tickets cannot be negative");
        }
        try {
            redisTemplate.opsForValue().set(inventoryKey(scheduleId, type), String.valueOf(availableTickets));
        } catch (DataAccessException exception) {
            throw unavailable("initializeInventory", scheduleId, type, null, exception);
        }
    }

    @Override
    public HoldResult holdTickets(String scheduleId, String ticketType, Integer quantity, UUID userId) {
        return holdTickets(scheduleId, TicketType.parse(ticketType), quantity, userId);
    }

    @Override
    public HoldResult holdTickets(String scheduleId, TicketType type, int quantity, UUID userId) {
        String holdId = UUID.randomUUID().toString();
        Instant createdAt = Instant.now();
        Instant expiresAt = createdAt.plus(HOLD_TTL);
        try {
            List<?> result = redisTemplate.execute(
                    HOLD_SCRIPT,
                    List.of(inventoryKey(scheduleId, type), holdKey(holdId), activeHoldsKey(scheduleId, type)),
                    String.valueOf(quantity),
                    holdId,
                    scheduleId,
                    type.name(),
                    userId.toString(),
                    createdAt.toString(),
                    expiresAt.toString(),
                    String.valueOf(HOLD_TTL.toSeconds()),
                    String.valueOf(createdAt.getEpochSecond()),
                    holdKeyPrefix(),
                    String.valueOf(expiresAt.getEpochSecond()),
                    String.valueOf(ACTIVE_HOLDS_INDEX_GRACE.toSeconds())
            );

            int remaining = parseRemaining(result);
            if (result == null || result.isEmpty() || !"1".equals(String.valueOf(result.getFirst()))) {
                return new HoldResult(false, null, "Insufficient ticket inventory", null, remaining);
            }
            return new HoldResult(
                    true,
                    String.valueOf(result.get(1)),
                    "Tickets held successfully",
                    Instant.parse(String.valueOf(result.get(3))),
                    remaining
            );
        } catch (DataAccessException | IllegalStateException exception) {
            throw unavailable("holdTickets", scheduleId, type, holdId, exception);
        }
    }

    @Override
    public int effectiveAvailability(String scheduleId, TicketType type, int persistentAvailable) {
        initializeInventory(scheduleId, type, persistentAvailable);
        try {
            Long result = redisTemplate.execute(
                    AVAILABLE_SCRIPT,
                    List.of(inventoryKey(scheduleId, type), activeHoldsKey(scheduleId, type)),
                    String.valueOf(Instant.now().getEpochSecond()),
                    holdKeyPrefix(),
                    String.valueOf(ACTIVE_HOLDS_INDEX_GRACE.toSeconds())
            );
            return Math.max(0, result == null ? 0 : result.intValue());
        } catch (DataAccessException exception) {
            throw unavailable("effectiveAvailability", scheduleId, type, null, exception);
        }
    }

    @Override
    public void releaseHold(String holdId) {
        try {
            redisTemplate.execute(
                    RELEASE_SCRIPT,
                    List.of(holdKey(holdId)),
                    ACTIVE_HOLDS_PREFIX,
                    holdId,
                    String.valueOf(ACTIVE_HOLDS_INDEX_GRACE.toSeconds())
            );
        } catch (DataAccessException exception) {
            throw unavailable("releaseHold", null, null, holdId, exception);
        }
    }

    @Override
    public Optional<TicketHoldInfo> getHold(String holdId) {
        try {
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(holdKey(holdId));
            if (entries == null || entries.isEmpty()) {
                return Optional.empty();
            }
            return Optional.of(new TicketHoldInfo(
                    value(entries, "holdId"),
                    value(entries, "scheduleId"),
                    value(entries, "ticketType"),
                    Integer.parseInt(value(entries, "quantity")),
                    UUID.fromString(value(entries, "userId")),
                    Instant.parse(value(entries, "createdAt")),
                    Instant.parse(value(entries, "expiresAt"))
            ));
        } catch (DataAccessException exception) {
            throw unavailable("getHold", null, null, holdId, exception);
        }
    }

    @Override
    public boolean isHoldValid(String holdId) {
        return getHold(holdId).map(hold -> hold.expiresAt().isAfter(Instant.now())).orElse(false);
    }

    public String inventoryKey(String scheduleId, TicketType type) {
        return INVENTORY_PREFIX + scheduleId + ':' + type.name();
    }

    String activeHoldsKey(String scheduleId, TicketType type) {
        return ACTIVE_HOLDS_PREFIX + scheduleId + ':' + type.name();
    }

    String holdKeyPrefix() {
        return HOLD_PREFIX;
    }

    private String holdKey(String holdId) {
        return holdKeyPrefix() + holdId;
    }

    private int parseRemaining(List<?> result) {
        if (result == null || result.size() < 3) {
            return 0;
        }
        return Math.max(0, Integer.parseInt(String.valueOf(result.get(2))));
    }

    private String value(Map<Object, Object> entries, String key) {
        Object value = entries.get(key);
        if (value == null) {
            throw new IllegalStateException("Missing hold field: " + key);
        }
        return value.toString();
    }

    private TicketHoldServiceUnavailableException unavailable(
            String operation,
            String scheduleId,
            TicketType type,
            String holdId,
            Exception exception
    ) {
        log.error(
                "Redis ticket hold operation failed: operation={}, scheduleId={}, ticketType={}, holdId={}",
                operation, scheduleId, type, holdId, exception
        );
        return new TicketHoldServiceUnavailableException("Ticket hold service is temporarily unavailable");
    }
}
