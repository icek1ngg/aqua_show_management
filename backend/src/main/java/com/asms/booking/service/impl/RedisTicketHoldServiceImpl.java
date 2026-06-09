package com.asms.booking.service.impl;

import com.asms.booking.dto.TicketHoldDtos.HoldResult;
import com.asms.booking.dto.TicketHoldDtos.TicketHoldInfo;
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
    private static final String INVENTORY_PREFIX = "booking:inventory:";
    private static final String HOLD_PREFIX = "booking:hold:";
    private static final String HELD_PREFIX = "booking:held:";

    private static final RedisScript<List> HOLD_SCRIPT = new DefaultRedisScript<>(
            """
            local inventory = tonumber(redis.call('GET', KEYS[1]) or '0')
            local held = tonumber(redis.call('GET', KEYS[3]) or '0')
            local quantity = tonumber(ARGV[1])
            if inventory - held < quantity then
              return {'0', '', ''}
            end

            redis.call('INCRBY', KEYS[3], quantity)
            redis.call('HSET', KEYS[2],
              'holdId', ARGV[2],
              'scheduleId', ARGV[3],
              'ticketType', ARGV[4],
              'quantity', ARGV[1],
              'userId', ARGV[5],
              'createdAt', ARGV[6],
              'expiresAt', ARGV[7])
            redis.call('EXPIRE', KEYS[2], tonumber(ARGV[8]))
            redis.call('EXPIRE', KEYS[3], tonumber(ARGV[8]))
            return {'1', ARGV[2], ARGV[7]}
            """,
            List.class
    );

    private static final RedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>(
            """
            local hold = redis.call('HGETALL', KEYS[1])
            if next(hold) == nil then
              return 0
            end

            local scheduleId = ''
            local ticketType = ''
            local quantity = 0
            for i = 1, #hold, 2 do
              if hold[i] == 'scheduleId' then scheduleId = hold[i + 1] end
              if hold[i] == 'ticketType' then ticketType = hold[i + 1] end
              if hold[i] == 'quantity' then quantity = tonumber(hold[i + 1]) end
            end

            if scheduleId ~= '' and ticketType ~= '' and quantity > 0 then
              local heldKey = 'booking:held:' .. scheduleId .. ':' .. ticketType
              local remaining = redis.call('DECRBY', heldKey, quantity)
              if remaining < 0 then
                redis.call('SET', heldKey, 0)
              end
            end

            redis.call('DEL', KEYS[1])
            return 1
            """,
            Long.class
    );

    private final StringRedisTemplate redisTemplate;

    public RedisTicketHoldServiceImpl(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void initializeInventory(String scheduleId, String ticketType, int availableTickets) {
        if (availableTickets < 0) {
            throw new IllegalArgumentException("Available tickets cannot be negative");
        }
        String normalizedTicketType = normalizeTicketType(ticketType);
        try {
            redisTemplate.opsForValue().set(inventoryKey(scheduleId, normalizedTicketType), String.valueOf(availableTickets));
        } catch (DataAccessException exception) {
            log.error(
                    "Redis ticket inventory initialization failed: scheduleId={}, ticketType={}",
                    scheduleId,
                    normalizedTicketType,
                    exception
            );
            throw new TicketHoldServiceUnavailableException("Ticket hold service is temporarily unavailable");
        }
    }

    @Override
    public HoldResult holdTickets(String scheduleId, String ticketType, int quantity, UUID userId) {
        String normalizedTicketType = normalizeTicketType(ticketType);
        String holdId = UUID.randomUUID().toString();
        Instant createdAt = Instant.now();
        Instant expiresAt = createdAt.plus(HOLD_TTL);
        String inventoryKey = inventoryKey(scheduleId, normalizedTicketType);
        String heldKey = heldKey(scheduleId, normalizedTicketType);

        log.info(
                "Attempting Redis ticket hold: scheduleId={}, ticketType={}, quantity={}, userId={}, inventoryKey={}, heldKey={}",
                scheduleId,
                normalizedTicketType,
                quantity,
                userId,
                inventoryKey,
                heldKey
        );

        try {
            List<?> result = redisTemplate.execute(
                    HOLD_SCRIPT,
                    List.of(inventoryKey, holdKey(holdId), heldKey),
                    String.valueOf(quantity),
                    holdId,
                    scheduleId,
                    normalizedTicketType,
                    userId.toString(),
                    createdAt.toString(),
                    expiresAt.toString(),
                    String.valueOf(HOLD_TTL.toSeconds())
            );

            if (result == null || result.isEmpty() || !"1".equals(String.valueOf(result.getFirst()))) {
                log.warn(
                        "Redis ticket hold rejected due to insufficient inventory: scheduleId={}, ticketType={}, requestedQuantity={}, userId={}",
                        scheduleId,
                        normalizedTicketType,
                        quantity,
                        userId
                );
                return new HoldResult(false, null, "Insufficient ticket inventory", null);
            }

            String returnedHoldId = String.valueOf(result.get(1));
            Instant returnedExpiresAt = Instant.parse(String.valueOf(result.get(2)));
            log.info(
                    "Redis ticket hold created: holdId={}, scheduleId={}, ticketType={}, quantity={}, userId={}, expiresAt={}, ttlSeconds={}",
                    returnedHoldId,
                    scheduleId,
                    normalizedTicketType,
                    quantity,
                    userId,
                    returnedExpiresAt,
                    HOLD_TTL.toSeconds()
            );
            return new HoldResult(true, returnedHoldId, "Tickets held successfully", returnedExpiresAt);
        } catch (DataAccessException | IllegalStateException exception) {
            log.error(
                    "Redis ticket hold operation failed: operation={}, scheduleId={}, ticketType={}, holdId={}",
                    "holdTickets",
                    scheduleId,
                    normalizedTicketType,
                    holdId,
                    exception
            );
            throw new TicketHoldServiceUnavailableException("Ticket hold service is temporarily unavailable");
        }
    }

    @Override
    public void releaseHold(String holdId) {
        log.info("Releasing Redis ticket hold: holdId={}", holdId);
        try {
            Optional<TicketHoldInfo> hold = getHold(holdId);
            Long releaseResult = redisTemplate.execute(RELEASE_SCRIPT, List.of(holdKey(holdId)), holdId);
            if (releaseResult == null || releaseResult == 0) {
                log.warn("Redis ticket hold release skipped because hold does not exist: holdId={}", holdId);
                return;
            }
            hold.ifPresentOrElse(
                    holdInfo -> log.info(
                            "Redis ticket hold released: holdId={}, scheduleId={}, ticketType={}, quantity={}",
                            holdInfo.holdId(),
                            holdInfo.scheduleId(),
                            holdInfo.ticketType(),
                            holdInfo.quantity()
                    ),
                    () -> log.info("Redis ticket hold released: holdId={}, scheduleId={}, ticketType={}, quantity={}", holdId, null, null, null)
            );
        } catch (DataAccessException exception) {
            log.error(
                    "Redis ticket hold operation failed: operation={}, scheduleId={}, ticketType={}, holdId={}",
                    "releaseHold",
                    null,
                    null,
                    holdId,
                    exception
            );
            throw new TicketHoldServiceUnavailableException("Ticket hold service is temporarily unavailable");
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
            log.error(
                    "Redis ticket hold operation failed: operation={}, scheduleId={}, ticketType={}, holdId={}",
                    "getHold",
                    null,
                    null,
                    holdId,
                    exception
            );
            throw new TicketHoldServiceUnavailableException("Ticket hold service is temporarily unavailable");
        }
    }

    @Override
    public boolean isHoldValid(String holdId) {
        return getHold(holdId)
                .map(hold -> hold.expiresAt().isAfter(Instant.now()))
                .orElse(false);
    }

    private String value(Map<Object, Object> entries, String key) {
        Object value = entries.get(key);
        if (value == null) {
            throw new IllegalStateException("Missing hold field: " + key);
        }
        return value.toString();
    }

    private String inventoryKey(String scheduleId, String ticketType) {
        return INVENTORY_PREFIX + scheduleId;
    }

    private String holdKey(String holdId) {
        return HOLD_PREFIX + holdId;
    }

    private String heldKey(String scheduleId, String ticketType) {
        return HELD_PREFIX + scheduleId;
    }

    private String normalizeTicketType(String ticketType) {
        return ticketType == null ? "" : ticketType.trim();
    }
}
