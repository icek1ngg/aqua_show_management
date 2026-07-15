package com.asms.identity.service.impl;

import com.asms.core.exception.AuthRateLimitException;
import com.asms.core.exception.ErrorCode;
import com.asms.identity.service.AuthRateLimitService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class RedisAuthRateLimitService implements AuthRateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RedisAuthRateLimitService.class);
    private static final long ONE_HOUR_MILLIS = 3_600_000L;
    private static final long FIFTEEN_MINUTES_MILLIS = 900_000L;
    private static final long ONE_MINUTE_MILLIS = 60_000L;

    // Both registration dimensions deliberately share one Redis Cluster slot so the
    // combined IP + email decision remains atomic. This trades one hot slot for correctness.
    private static final String REGISTRATION_IP_PREFIX = "auth:rate-limit:{registration}:ip:";
    private static final String REGISTRATION_EMAIL_PREFIX = "auth:rate-limit:{registration}:email:";
    private static final String RESEND_COOLDOWN_PREFIX = "auth:rate-limit:resend:cooldown:{resend:";
    private static final String RESEND_HOUR_PREFIX = "auth:rate-limit:resend:hour:{resend:";

    private static final String LOGIN_IP_PREFIX = "auth:rate-limit:{login}:ip:";
    private static final String LOGIN_EMAIL_IP_PREFIX = "auth:rate-limit:{login}:email-ip:";
    private static final String FORGOT_IP_PREFIX = "auth:rate-limit:{forgot}:ip:";
    private static final String FORGOT_EMAIL_PREFIX = "auth:rate-limit:{forgot}:email:";
    private static final String RESET_IP_PREFIX = "auth:rate-limit:{reset}:ip:";
    private static final String REFRESH_IP_PREFIX = "auth:rate-limit:{refresh}:ip:";

    private static final RedisScript<Long> REGISTRATION_SCRIPT = new DefaultRedisScript<>(
            """
            local redisTime = redis.call('TIME')
            local now = (tonumber(redisTime[1]) * 1000) + math.floor(tonumber(redisTime[2]) / 1000)
            local window = tonumber(ARGV[3])
            local cutoff = now - window
            redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', cutoff)
            redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', cutoff)
            local ipCount = redis.call('ZCARD', KEYS[1])
            local emailCount = redis.call('ZCARD', KEYS[2])
            if ipCount >= tonumber(ARGV[1]) or emailCount >= tonumber(ARGV[2]) then
              return 0
            end
            local member = tostring(now) .. ':' .. ARGV[4]
            redis.call('ZADD', KEYS[1], now, member)
            redis.call('ZADD', KEYS[2], now, member)
            redis.call('PEXPIRE', KEYS[1], window)
            redis.call('PEXPIRE', KEYS[2], window)
            return 1
            """,
            Long.class
    );

    private static final RedisScript<Long> RESEND_SCRIPT = new DefaultRedisScript<>(
            """
            if redis.call('EXISTS', KEYS[1]) == 1 then
              return 0
            end
            local redisTime = redis.call('TIME')
            local now = (tonumber(redisTime[1]) * 1000) + math.floor(tonumber(redisTime[2]) / 1000)
            local window = tonumber(ARGV[3])
            redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now - window)
            local hourCount = redis.call('ZCARD', KEYS[2])
            if hourCount >= tonumber(ARGV[1]) then
              return 0
            end
            redis.call('SET', KEYS[1], '1', 'PX', tonumber(ARGV[2]))
            local member = tostring(now) .. ':' .. ARGV[4]
            redis.call('ZADD', KEYS[2], now, member)
            redis.call('PEXPIRE', KEYS[2], window)
            return 1
            """,
            Long.class
    );

    private static final RedisScript<Long> SINGLE_LIMIT_SCRIPT = new DefaultRedisScript<>(
            """
            local redisTime = redis.call('TIME')
            local now = (tonumber(redisTime[1]) * 1000) + math.floor(tonumber(redisTime[2]) / 1000)
            local window = tonumber(ARGV[2])
            local cutoff = now - window
            redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', cutoff)
            local count = redis.call('ZCARD', KEYS[1])
            if count >= tonumber(ARGV[1]) then
              return 0
            end
            local member = tostring(now) .. ':' .. ARGV[3]
            redis.call('ZADD', KEYS[1], now, member)
            redis.call('PEXPIRE', KEYS[1], window)
            return 1
            """,
            Long.class
    );

    private final StringRedisTemplate redisTemplate;
    private final int registrationIpPerHour;
    private final int registrationEmailPerHour;
    private final int resendCooldownSeconds;
    private final int resendEmailPerHour;
    private final int loginIpPer15Min;
    private final int loginEmailIpPer15Min;
    private final int forgotIpPerHour;
    private final int forgotEmailPerHour;
    private final int resetIpPer15Min;
    private final int refreshIpPerMin;

    public RedisAuthRateLimitService(
            StringRedisTemplate redisTemplate,
            @Value("${asms.auth.rate-limit.registration-ip-per-hour}") int registrationIpPerHour,
            @Value("${asms.auth.rate-limit.registration-email-per-hour}") int registrationEmailPerHour,
            @Value("${asms.auth.rate-limit.resend-cooldown-seconds}") int resendCooldownSeconds,
            @Value("${asms.auth.rate-limit.resend-email-per-hour}") int resendEmailPerHour,
            @Value("${asms.auth.rate-limit.login-ip-per-15min}") int loginIpPer15Min,
            @Value("${asms.auth.rate-limit.login-email-ip-per-15min}") int loginEmailIpPer15Min,
            @Value("${asms.auth.rate-limit.forgot-ip-per-hour}") int forgotIpPerHour,
            @Value("${asms.auth.rate-limit.forgot-email-per-hour}") int forgotEmailPerHour,
            @Value("${asms.auth.rate-limit.reset-ip-per-15min}") int resetIpPer15Min,
            @Value("${asms.auth.rate-limit.refresh-ip-per-min}") int refreshIpPerMin
    ) {
        this.redisTemplate = redisTemplate;
        this.registrationIpPerHour = registrationIpPerHour;
        this.registrationEmailPerHour = registrationEmailPerHour;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.resendEmailPerHour = resendEmailPerHour;
        this.loginIpPer15Min = loginIpPer15Min;
        this.loginEmailIpPer15Min = loginEmailIpPer15Min;
        this.forgotIpPerHour = forgotIpPerHour;
        this.forgotEmailPerHour = forgotEmailPerHour;
        this.resetIpPer15Min = resetIpPer15Min;
        this.refreshIpPerMin = refreshIpPerMin;
    }

    @Override
    public void checkRegistration(String normalizedEmail, String remoteIp) {
        try {
            Long result = redisTemplate.execute(
                    REGISTRATION_SCRIPT,
                    List.of(REGISTRATION_IP_PREFIX + digest(remoteIp), REGISTRATION_EMAIL_PREFIX + digest(normalizedEmail)),
                    String.valueOf(registrationIpPerHour),
                    String.valueOf(registrationEmailPerHour),
                    String.valueOf(ONE_HOUR_MILLIS),
                    UUID.randomUUID().toString()
            );
            requireAccepted(result);
        } catch (DataAccessException exception) {
            log.error(
                    "Redis auth rate limit failed: operation=registration, keyTypes=registration-ip,registration-email",
                    exception
            );
            throw unavailable();
        }
    }

    @Override
    public void checkResend(String normalizedEmail) {
        String digest = digest(normalizedEmail);
        String slotSuffix = digest + "}";
        try {
            Long result = redisTemplate.execute(
                    RESEND_SCRIPT,
                    List.of(RESEND_COOLDOWN_PREFIX + slotSuffix, RESEND_HOUR_PREFIX + slotSuffix),
                    String.valueOf(resendEmailPerHour),
                    String.valueOf(resendCooldownSeconds * 1000L),
                    String.valueOf(ONE_HOUR_MILLIS),
                    UUID.randomUUID().toString()
            );
            requireAccepted(result);
        } catch (DataAccessException exception) {
            log.error(
                    "Redis auth rate limit failed: operation=resend, keyTypes=resend-cooldown,resend-email-hour",
                    exception
            );
            throw unavailable();
        }
    }

    @Override
    public void checkLoginFailure(String normalizedEmail, String remoteIp) {
        try {
            Long result = redisTemplate.execute(
                    REGISTRATION_SCRIPT,
                    List.of(LOGIN_IP_PREFIX + digest(remoteIp), LOGIN_EMAIL_IP_PREFIX + digest(normalizedEmail + ":" + remoteIp)),
                    String.valueOf(loginIpPer15Min),
                    String.valueOf(loginEmailIpPer15Min),
                    String.valueOf(FIFTEEN_MINUTES_MILLIS),
                    UUID.randomUUID().toString()
            );
            requireAccepted(result);
        } catch (DataAccessException exception) {
            log.error("Redis auth rate limit failed: operation=login", exception);
            throw unavailable();
        }
    }

    @Override
    public void clearLoginFailure(String normalizedEmail, String remoteIp) {
        try {
            redisTemplate.delete(LOGIN_EMAIL_IP_PREFIX + digest(normalizedEmail + ":" + remoteIp));
        } catch (DataAccessException exception) {
            log.error("Redis auth rate limit failed: operation=clearLogin", exception);
        }
    }

    @Override
    public boolean checkForgot(String normalizedEmail, String remoteIp) {
        try {
            Long result = redisTemplate.execute(
                    REGISTRATION_SCRIPT,
                    List.of(FORGOT_IP_PREFIX + digest(remoteIp), FORGOT_EMAIL_PREFIX + digest(normalizedEmail)),
                    String.valueOf(forgotIpPerHour),
                    String.valueOf(forgotEmailPerHour),
                    String.valueOf(ONE_HOUR_MILLIS),
                    UUID.randomUUID().toString()
            );
            return result != null && result == 1L;
        } catch (DataAccessException exception) {
            log.error("Redis auth rate limit failed: operation=forgot", exception);
            return false;
        }
    }

    @Override
    public void checkReset(String remoteIp) {
        try {
            Long result = redisTemplate.execute(
                    SINGLE_LIMIT_SCRIPT,
                    List.of(RESET_IP_PREFIX + digest(remoteIp)),
                    String.valueOf(resetIpPer15Min),
                    String.valueOf(FIFTEEN_MINUTES_MILLIS),
                    UUID.randomUUID().toString()
            );
            requireAccepted(result);
        } catch (DataAccessException exception) {
            log.error("Redis auth rate limit failed: operation=reset", exception);
            throw unavailable();
        }
    }

    @Override
    public void checkRefresh(String remoteIp) {
        try {
            Long result = redisTemplate.execute(
                    SINGLE_LIMIT_SCRIPT,
                    List.of(REFRESH_IP_PREFIX + digest(remoteIp)),
                    String.valueOf(refreshIpPerMin),
                    String.valueOf(ONE_MINUTE_MILLIS),
                    UUID.randomUUID().toString()
            );
            requireAccepted(result);
        } catch (DataAccessException exception) {
            log.error("Redis auth rate limit failed: operation=refresh", exception);
            throw unavailable();
        }
    }

    private void requireAccepted(Long result) {
        if (result == null) {
            throw unavailable();
        }
        if (result == 0L) {
            throw new AuthRateLimitException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    ErrorCode.AUTH_RATE_LIMITED,
                    "Too many authentication requests. Please try again later."
            );
        }
        if (result != 1L) {
            throw unavailable();
        }
    }

    private AuthRateLimitException unavailable() {
        return new AuthRateLimitException(
                HttpStatus.SERVICE_UNAVAILABLE,
                ErrorCode.RATE_LIMIT_SERVICE_UNAVAILABLE,
                "Authentication rate limit service is temporarily unavailable."
        );
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
}
