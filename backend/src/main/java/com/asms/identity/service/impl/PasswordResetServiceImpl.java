package com.asms.identity.service.impl;

import com.asms.core.exception.BadRequestException;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.AuthChallengeType;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.AuthChallengeService;
import com.asms.identity.service.PasswordResetMailEvents.PasswordChanged;
import com.asms.identity.service.PasswordResetMailEvents.ResetRequested;
import com.asms.identity.service.PasswordResetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetServiceImpl.class);

    private final AuthChallengeService challengeService;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PasswordEncoder passwordEncoder;
    private final com.asms.identity.service.AuthSessionService authSessionService;

    public PasswordResetServiceImpl(
            AuthChallengeService challengeService,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher,
            PasswordEncoder passwordEncoder,
            com.asms.identity.service.AuthSessionService authSessionService
    ) {
        this.challengeService = challengeService;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.passwordEncoder = passwordEncoder;
        this.authSessionService = authSessionService;
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email.trim());
        if (userOpt.isEmpty()) {
            return;
        }

        User user = userOpt.get();

        // Check if user is Google-only
        if (user.getAuthProvider() == AuthProvider.GOOGLE && user.getPasswordHash() == null) {
            return;
        }

        // Check if user is disabled or inactive
        if (user.getStatus() == UserStatus.DISABLED || user.getStatus() == UserStatus.INACTIVE) {
            return;
        }

        try {
            AuthChallengeService.IssuedChallenge issued = challengeService.issue(
                    user,
                    AuthChallengeType.PASSWORD_RESET,
                    java.time.Duration.ofMinutes(15)
            );
            String tokenString = issued.rawToken();

            eventPublisher.publishEvent(new ResetRequested(user, tokenString));
        } catch (Exception e) {
            log.error("Failed to process password reset request for user {}", user.getId(), e);
        }
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        com.asms.identity.entity.AuthChallenge challenge = challengeService.consume(token, AuthChallengeType.PASSWORD_RESET);

        User user = challenge.getUser();

        // Verify user is eligible for reset
        if (user.getAuthProvider() == AuthProvider.GOOGLE && user.getPasswordHash() == null) {
            throw new BadRequestException("Google sign-in accounts cannot reset password");
        }

        if (user.getStatus() == UserStatus.DISABLED || user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("Account is inactive or disabled");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.invalidateAuthentication();
        authSessionService.revokeAll(user);
        userRepository.save(user);

        eventPublisher.publishEvent(new PasswordChanged(user));
    }
}
