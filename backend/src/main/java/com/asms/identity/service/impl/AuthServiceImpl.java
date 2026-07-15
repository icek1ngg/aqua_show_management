package com.asms.identity.service.impl;

import com.asms.core.exception.AuthRateLimitException;
import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.MailSendingException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.dto.AuthDtos.AuthSession;
import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.dto.AuthDtos.LoginResponse;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.dto.AuthDtos.RegisterResponse;
import com.asms.identity.dto.AuthDtos.UserProfileResponse;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.service.AuthService;
import com.asms.identity.service.AuthRateLimitService;
import com.asms.identity.service.RegistrationPersistenceService;
import com.asms.identity.service.RegistrationPersistenceService.PendingRegistration;
import com.asms.identity.service.RefreshTokenService;
import com.asms.identity.service.VerificationEmailSender;
import com.asms.identity.service.RefreshTokenService.RefreshTokenIssue;
import com.asms.identity.service.RefreshTokenService.RefreshTokenRotation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final RegistrationPersistenceService registrationPersistenceService;
    private final VerificationEmailSender verificationEmailSender;
    private final AuthRateLimitService authRateLimitService;

    @Autowired
    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            RegistrationPersistenceService registrationPersistenceService,
            VerificationEmailSender verificationEmailSender,
            AuthRateLimitService authRateLimitService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.registrationPersistenceService = registrationPersistenceService;
        this.verificationEmailSender = verificationEmailSender;
        this.authRateLimitService = authRateLimitService;
    }

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            RegistrationPersistenceService registrationPersistenceService,
            VerificationEmailSender verificationEmailSender
    ) {
        this(
                userRepository,
                passwordEncoder,
                jwtService,
                refreshTokenService,
                registrationPersistenceService,
                verificationEmailSender,
                new AuthRateLimitService() {
                    @Override
                    public void checkRegistration(String normalizedEmail, String remoteIp) {
                        throw rateLimitUnavailable();
                    }

                    @Override
                    public void checkResend(String normalizedEmail) {
                        throw rateLimitUnavailable();
                    }
                }
        );
    }

    @Override
    public RegisterResponse register(RegisterRequest request, String remoteIp) {
        authRateLimitService.checkRegistration(normalizeEmail(request.email()), remoteIp);
        PendingRegistration pending = registrationPersistenceService.create(request);
        boolean verificationEmailSent = true;
        try {
            verificationEmailSender.send(pending.user(), pending.rawToken());
        } catch (MailSendingException exception) {
            verificationEmailSent = false;
        }
        return new RegisterResponse(
                pending.user().getId(),
                pending.user().getEmail(),
                verificationEmailSent
        );
    }

    @Override
    @Transactional
    public AuthSession login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(this::invalidCredentials);

        if (user.getAuthProvider() != AuthProvider.LOCAL
                || user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }

        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new UnauthorizedException(
                    ErrorCode.EMAIL_VERIFICATION_REQUIRED,
                    "Please verify your email before signing in."
            );
        }

        if (!user.isEnabled()) {
            throw invalidCredentials();
        }

        String accessToken = jwtService.generateToken(user);
        LoginResponse response = new LoginResponse(accessToken, "Bearer", jwtService.getExpirationSeconds(), toProfileResponse(user));

        if (refreshTokenService == null) {
            return new AuthSession(response, "", -1);
        }

        RefreshTokenIssue refreshToken = refreshTokenService.createRefreshToken(user, Boolean.TRUE.equals(request.rememberMe()));
        return new AuthSession(response, refreshToken.token(), refreshToken.cookieMaxAgeSeconds());
    }

    @Override
    @Transactional(readOnly = true)
    public AuthSession refresh(String refreshToken) {
        RefreshTokenRotation rotatedRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken);
        User user = rotatedRefreshToken.user();
        String accessToken = jwtService.generateToken(user);
        LoginResponse response = new LoginResponse(accessToken, "Bearer", jwtService.getExpirationSeconds(), toProfileResponse(user));
        return new AuthSession(response, rotatedRefreshToken.token(), rotatedRefreshToken.cookieMaxAgeSeconds());
    }

    @Override
    public void logout(String refreshToken) {
        if (refreshTokenService != null) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
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

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private UnauthorizedException invalidCredentials() {
        return new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password");
    }

    private static AuthRateLimitException rateLimitUnavailable() {
        return new AuthRateLimitException(
                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                ErrorCode.RATE_LIMIT_SERVICE_UNAVAILABLE,
                "Authentication rate limit service is temporarily unavailable."
        );
    }

}
