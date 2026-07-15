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
import com.asms.identity.dto.SessionDtos.ClientContext;
import com.asms.identity.service.AuthSessionService;
import com.asms.identity.service.VerificationEmailSender;
import com.asms.identity.dto.SessionDtos.SessionIssue;
import com.asms.identity.dto.SessionDtos.SessionRotation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthServiceImpl implements AuthService {

    private static final String DUMMY_BCRYPT_HASH =
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthSessionService authSessionService;
    private final RegistrationPersistenceService registrationPersistenceService;
    private final VerificationEmailSender verificationEmailSender;
    private final AuthRateLimitService authRateLimitService;

    @Autowired
    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthSessionService authSessionService,
            RegistrationPersistenceService registrationPersistenceService,
            VerificationEmailSender verificationEmailSender,
            AuthRateLimitService authRateLimitService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authSessionService = authSessionService;
        this.registrationPersistenceService = registrationPersistenceService;
        this.verificationEmailSender = verificationEmailSender;
        this.authRateLimitService = authRateLimitService;
    }

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthSessionService authSessionService,
            RegistrationPersistenceService registrationPersistenceService,
            VerificationEmailSender verificationEmailSender
    ) {
        this(
                userRepository,
                passwordEncoder,
                jwtService,
                authSessionService,
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
    public AuthSession login(LoginRequest request, ClientContext clientContext) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email())).orElse(null);
        boolean localUserWithPassword = user != null
                && user.getAuthProvider() == AuthProvider.LOCAL
                && user.getPasswordHash() != null;
        String passwordHash = localUserWithPassword ? user.getPasswordHash() : DUMMY_BCRYPT_HASH;
        boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);

        if (!localUserWithPassword || !passwordMatches) {
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

        if (authSessionService == null) {
            return new AuthSession(response, "", -1);
        }

        SessionIssue sessionIssue = authSessionService.create(user, Boolean.TRUE.equals(request.rememberMe()), clientContext);
        return new AuthSession(response, sessionIssue.token(), sessionIssue.cookieMaxAgeSeconds());
    }

    @Override
    @Transactional(readOnly = true)
    public AuthSession refresh(String refreshToken, ClientContext clientContext) {
        SessionRotation rotatedSession = authSessionService.rotate(refreshToken, clientContext);
        User user = rotatedSession.user();
        String accessToken = jwtService.generateToken(user);
        LoginResponse response = new LoginResponse(accessToken, "Bearer", jwtService.getExpirationSeconds(), toProfileResponse(user));
        return new AuthSession(response, rotatedSession.token(), rotatedSession.cookieMaxAgeSeconds());
    }

    @Override
    public void logout(String refreshToken) {
        if (authSessionService != null) {
            authSessionService.revoke(refreshToken);
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
