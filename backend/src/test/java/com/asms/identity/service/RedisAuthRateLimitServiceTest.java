package com.asms.identity.service;

import com.asms.core.exception.AuthRateLimitException;
import com.asms.core.exception.ErrorCode;
import com.asms.identity.service.impl.RedisAuthRateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisAuthRateLimitServiceTest {

    private StringRedisTemplate redisTemplate;
    private RedisAuthRateLimitService service;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        service = new RedisAuthRateLimitService(redisTemplate, 10, 3, 60, 5);
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void registrationUsesAtomicRollingWindowsWithHashedClusterColocatedKeys() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class)))
                .thenReturn(1L);

        assertThatCode(() -> service.checkRegistration("user@example.com", "127.0.0.1"))
                .doesNotThrowAnyException();

        ArgumentCaptor<RedisScript> script = ArgumentCaptor.forClass(RedisScript.class);
        ArgumentCaptor<List<String>> keys = ArgumentCaptor.forClass(List.class);
        verify(redisTemplate).execute(script.capture(), keys.capture(), any(Object[].class));
        assertThat(script.getValue().getScriptAsString())
                .contains("TIME", "ZREMRANGEBYSCORE", "ZCARD", "ZADD", "PEXPIRE")
                .doesNotContain("INCR", "GET");
        assertThat(keys.getValue()).allSatisfy(key -> {
            assertThat(key).contains("{registration}");
            assertThat(key).doesNotContain("user@example.com", "127.0.0.1");
        });
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void resendCombinesCooldownAndRollingWindowInOneAtomicScript() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class)))
                .thenReturn(1L);

        service.checkResend("user@example.com");

        ArgumentCaptor<RedisScript> script = ArgumentCaptor.forClass(RedisScript.class);
        ArgumentCaptor<List<String>> keys = ArgumentCaptor.forClass(List.class);
        verify(redisTemplate).execute(script.capture(), keys.capture(), any(Object[].class));
        assertThat(script.getValue().getScriptAsString())
                .contains("EXISTS", "TIME", "ZREMRANGEBYSCORE", "ZCARD", "SET", "ZADD", "PEXPIRE");
        String firstSlot = hashTag(keys.getValue().get(0));
        assertThat(hashTag(keys.getValue().get(1))).isEqualTo(firstSlot);
        assertThat(keys.getValue()).allSatisfy(key -> assertThat(key).doesNotContain("user@example.com"));
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void redisLimitResultMapsToStableTooManyRequestsCode() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class)))
                .thenReturn(0L);

        assertThatThrownBy(() -> service.checkResend("user@example.com"))
                .isInstanceOfSatisfying(AuthRateLimitException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.AUTH_RATE_LIMITED);
                    assertThat(exception.getStatus().value()).isEqualTo(429);
                });
    }

    private String hashTag(String key) {
        return key.substring(key.indexOf('{'), key.indexOf('}') + 1);
    }
}
