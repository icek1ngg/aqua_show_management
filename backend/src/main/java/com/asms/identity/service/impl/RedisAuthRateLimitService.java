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

@Service
public class RedisAuthRateLimitService implements AuthRateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RedisAuthRateLimitService.class);
    private static final int ONE_HOUR_SECONDS = 3600;
    private static final String REGISTRATION_IP_PREFIX = "auth:rate-limit:registration:ip:";
    private static final String REGISTRATION_EMAIL_PREFIX = "auth:rate-limit:registration:email:";
    private static final String RESEND_COOLDOWN_PREFIX = "auth:rate-limit:resend:cooldown:";
    private static final String RESEND_HOUR_PREFIX = "auth:rate-limit:resend:hour:";

    private static final RedisScript<Long> REGISTRATION_SCRIPT = new DefaultRedisScript<>(
            """
            local ipCount = tonumber(redis.call('GET', KEYS[1]) or '0')
            local emailCount = tonumber(redis.call('GET', KEYS[2]) or '0')
            if ipCount >= tonumber(ARGV[1]) or emailCount >= tonumber(ARGV[2]) then
              return 0
            end
            local newIpCount = redis.call('INCR', KEYS[1])
            if newIpCount == 1 then
              redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]))
            end
            local newEmailCount = redis.call('INCR', KEYS[2])
            if newEmailCount == 1 then
              redis.call('EXPIRE', KEYS[2], tonumber(ARGV[3]))
            end
            return 1
            """,
            Long.class
    );

    private static final RedisScript<Long> RESEND_SCRIPT = new DefaultRedisScript<>(
            """
            if redis.call('EXISTS', KEYS[1]) == 1 then
              return 0
            end
            local hourCount = tonumber(redis.call('GET', KEYS[2]) or '0')
            if hourCount >= tonumber(ARGV[1]) then
              return 0
            end
            redis.call('SET', KEYS[1], '1', 'EX', tonumber(ARGV[2]))
            local newHourCount = redis.call('INCR', KEYS[2])
            if newHourCount == 1 then
              redis.call('EXPIRE', KEYS[2], tonumber(ARGV[3]))
            end
            return 1
            """,
            Long.class
    );

    private final StringRedisTemplate redisTemplate;
    private final int registrationIpPerHour;
    private final int registrationEmailPerHour;
    private final int resendCooldownSeconds;
    private final int resendEmailPerHour;

    public RedisAuthRateLimitService(
            StringRedisTemplate redisTemplate,
            @Value("${asms.auth.rate-limit.registration-ip-per-hour}") int registrationIpPerHour,
            @Value("${asms.auth.rate-limit.registration-email-per-hour}") int registrationEmailPerHour,
            @Value("${asms.auth.rate-limit.resend-cooldown-seconds}") int resendCooldownSeconds,
            @Value("${asms.auth.rate-limit.resend-email-per-hour}") int resendEmailPerHour
    ) {
        this.redisTemplate = redisTemplate;
        this.registrationIpPerHour = registrationIpPerHour;
        this.registrationEmailPerHour = registrationEmailPerHour;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.resendEmailPerHour = resendEmailPerHour;
    }

    @Override
    public void checkRegistration(String normalizedEmail, String remoteIp) {
        try {
            Long result = redisTemplate.execute(
                    REGISTRATION_SCRIPT,
                    List.of(REGISTRATION_IP_PREFIX + digest(remoteIp), REGISTRATION_EMAIL_PREFIX + digest(normalizedEmail)),
                    String.valueOf(registrationIpPerHour),
                    String.valueOf(registrationEmailPerHour),
                    String.valueOf(ONE_HOUR_SECONDS)
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
        try {
            Long result = redisTemplate.execute(
                    RESEND_SCRIPT,
                    List.of(RESEND_COOLDOWN_PREFIX + digest, RESEND_HOUR_PREFIX + digest),
                    String.valueOf(resendEmailPerHour),
                    String.valueOf(resendCooldownSeconds),
                    String.valueOf(ONE_HOUR_SECONDS)
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
