package com.asms.identity.service;

import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.dto.AuthDtos.AuthSession;
import com.asms.identity.dto.AuthDtos.OAuthCompleteRequest;
import com.asms.identity.dto.SessionDtos.ClientContext;
import com.asms.identity.dto.SessionDtos.SessionIssue;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.service.impl.RedisOAuthOnboardingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.connection.StringRedisConnection;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class RedisOAuthOnboardingServiceTest {

    private StringRedisTemplate redisTemplate;
    private ObjectMapper objectMapper;
    private UserRepository userRepository;
    private AuthSessionService authSessionService;
    private JwtService jwtService;
    private ValueOperations<String, String> valueOperations;

    private RedisOAuthOnboardingService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        objectMapper = new ObjectMapper();
        userRepository = mock(UserRepository.class);
        authSessionService = mock(AuthSessionService.class);
        jwtService = mock(JwtService.class);

        service = new RedisOAuthOnboardingService(
                redisTemplate,
                objectMapper,
                userRepository,
                authSessionService,
                jwtService
        );
    }

    @Test
    void storeOnboardingCode_GeneratesCodeAndSavesToRedis() {
        String code = service.storeOnboardingCode("test@example.com", "John", "Doe", "google123");

        assertNotNull(code);
        verify(valueOperations).set(
                eq("oauth2:onboard:" + code),
                contains("test@example.com"),
                eq(Duration.ofMinutes(10))
        );
    }

    @Test
    void completeOnboarding_FailsIfTermsNotAccepted() {
        OAuthCompleteRequest req = new OAuthCompleteRequest("code123", false, "2026-07-15");
        ClientContext ctx = new ClientContext("agent", "127.0.0.1");

        assertThrows(BadRequestException.class, () -> service.completeOnboarding(req, ctx));
    }

    @Test
    @SuppressWarnings("unchecked")
    void completeOnboarding_FailsIfCodeInvalid() {
        OAuthCompleteRequest req = new OAuthCompleteRequest("invalid", true, "2026-07-15");
        ClientContext ctx = new ClientContext("agent", "127.0.0.1");

        when(redisTemplate.execute(any(RedisCallback.class))).thenReturn(null);

        assertThrows(UnauthorizedException.class, () -> service.completeOnboarding(req, ctx));
    }
}
