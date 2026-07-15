package com.asms.identity.service.impl;

import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.dto.AuthDtos.AuthSession;
import com.asms.identity.dto.AuthDtos.LoginResponse;
import com.asms.identity.dto.AuthDtos.OAuthCompleteRequest;
import com.asms.identity.dto.AuthDtos.UserProfileResponse;
import com.asms.identity.dto.SessionDtos.ClientContext;
import com.asms.identity.dto.SessionDtos.SessionIssue;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.service.AuthSessionService;
import com.asms.identity.service.OAuthOnboardingService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@Service
public class RedisOAuthOnboardingService implements OAuthOnboardingService {

    private static final String REDIS_PREFIX = "oauth2:onboard:";
    private static final Duration TTL = Duration.ofMinutes(10);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final AuthSessionService authSessionService;
    private final JwtService jwtService;
    private final SecureRandom secureRandom;

    public RedisOAuthOnboardingService(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            UserRepository userRepository,
            AuthSessionService authSessionService,
            JwtService jwtService
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.authSessionService = authSessionService;
        this.jwtService = jwtService;
        this.secureRandom = new SecureRandom();
    }

    @Override
    public String storeOnboardingCode(String email, String givenName, String familyName, String googleId) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        OnboardingPayload payload = new OnboardingPayload(email, givenName, familyName, googleId);
        try {
            String json = objectMapper.writeValueAsString(payload);
            redisTemplate.opsForValue().set(REDIS_PREFIX + code, json, TTL);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize onboarding payload", e);
        }

        return code;
    }

    @Override
    @Transactional
    public AuthSession completeOnboarding(OAuthCompleteRequest request, ClientContext clientContext) {
        if (!request.acceptedTerms()) {
            throw new BadRequestException("Must accept terms and conditions");
        }

        String jsonPayload = redisTemplate.execute((org.springframework.data.redis.core.RedisCallback<String>) connection -> {
            byte[] key = redisTemplate.getStringSerializer().serialize(REDIS_PREFIX + request.code());
            byte[] value = connection.stringCommands().getDel(key);
            return redisTemplate.getStringSerializer().deserialize(value);
        });

        if (jsonPayload == null) {
            throw new UnauthorizedException("Invalid or expired onboarding code");
        }

        OnboardingPayload payload;
        try {
            payload = objectMapper.readValue(jsonPayload, OnboardingPayload.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize onboarding payload", e);
        }

        User user = new User(
                payload.familyName(),
                payload.givenName(),
                payload.email(),
                "",
                null
        );
        user.setGoogleId(payload.googleId());
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.recordLegalConsent(request.legalDocumentVersion());
        user.markEmailVerified();

        user = userRepository.save(user);

        SessionIssue sessionIssue = authSessionService.create(user, true, clientContext);
        String accessToken = jwtService.generateToken(user, sessionIssue.sid());
        LoginResponse response = new LoginResponse(accessToken, "Bearer", jwtService.getExpirationSeconds(), toProfileResponse(user));

        return new AuthSession(response, sessionIssue.token(), sessionIssue.cookieMaxAgeSeconds());
    }

    private UserProfileResponse toProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getLastName(),
                user.getFirstMiddleName(),
                user.getGender(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getRole(),
                user.getStatus(),
                user.getAuthProvider(),
                user.getDateOfBirth(),
                user.getCreatedAt()
        );
    }

    public record OnboardingPayload(String email, String givenName, String familyName, String googleId) {
    }
}
