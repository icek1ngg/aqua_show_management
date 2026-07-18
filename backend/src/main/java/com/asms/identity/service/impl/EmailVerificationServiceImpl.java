package com.asms.identity.service.impl;

import com.asms.core.exception.AuthRateLimitException;
import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.MailSendingException;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.AuthRateLimitService;
import com.asms.identity.service.EmailVerificationService;
import com.asms.identity.service.VerificationChallengeService;
import com.asms.identity.service.VerificationEmailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationServiceImpl.class);
    private static final String RESEND_RESPONSE =
            "If the email exists and requires verification, a verification email has been sent.";

    private final VerificationChallengeService challengeService;
    private final UserRepository userRepository;
    private final VerificationEmailSender verificationEmailSender;
    private final AuthRateLimitService authRateLimitService;
    private final TaskExecutor verificationEmailExecutor;

    @Autowired
    public EmailVerificationServiceImpl(
            VerificationChallengeService challengeService,
            UserRepository userRepository,
            VerificationEmailSender verificationEmailSender,
            AuthRateLimitService authRateLimitService,
            @Qualifier("verificationEmailExecutor") TaskExecutor verificationEmailExecutor
    ) {
        this.challengeService = challengeService;
        this.userRepository = userRepository;
        this.verificationEmailSender = verificationEmailSender;
        this.authRateLimitService = authRateLimitService;
        this.verificationEmailExecutor = verificationEmailExecutor;
    }

    public EmailVerificationServiceImpl(
            VerificationChallengeService challengeService,
            UserRepository userRepository,
            VerificationEmailSender verificationEmailSender
    ) {
        this(challengeService, userRepository, verificationEmailSender, new AuthRateLimitService() {
            @Override
            public void checkRegistration(String normalizedEmail, String remoteIp) {
                throw rateLimitUnavailable();
            }

            @Override
            public void checkResend(String normalizedEmail) {
                throw rateLimitUnavailable();
            }

            @Override
            public void checkLoginFailure(String normalizedEmail, String remoteIp) {
                throw rateLimitUnavailable();
            }

            @Override
            public void clearLoginFailure(String normalizedEmail, String remoteIp) {
            }

            @Override
            public boolean checkForgot(String normalizedEmail, String remoteIp) {
                return false;
            }

            @Override
            public void checkReset(String remoteIp) {
                throw rateLimitUnavailable();
            }

            @Override
            public void checkRefresh(String remoteIp) {
                throw rateLimitUnavailable();
            }
        }, Runnable::run);
    }

    @Override
    public void sendVerificationEmail(User user) {
        String rawToken = challengeService.rotate(user);
        verificationEmailSender.send(user, rawToken);
    }

    @Override
    public void verifyEmail(String rawToken) {
        challengeService.verify(rawToken);
    }

    @Override
    public String resendVerificationEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        authRateLimitService.checkResend(normalizedEmail);
        var candidate = userRepository.findByEmailIgnoreCase(normalizedEmail);
        try {
            verificationEmailExecutor.execute(() -> candidate
                    .filter(user -> user.getStatus() == UserStatus.PENDING_VERIFICATION)
                    .ifPresent(this::rotateAndDeliver));
        } catch (TaskRejectedException exception) {
            log.warn("Verification resend task was rejected by the bounded executor");
        }
        return RESEND_RESPONSE;
    }

    private void rotateAndDeliver(User user) {
        try {
            challengeService.rotateIfPending(user.getId())
                    .ifPresent(challenge -> verificationEmailSender.send(
                            challenge.user(),
                            challenge.rawToken()
                    ));
        } catch (MailSendingException exception) {
            log.error("Failed to resend verification email for user {}", user.getId(), exception);
        } catch (RuntimeException exception) {
            log.error("Unexpected verification resend failure for user {}", user.getId());
        }
    }

    private static AuthRateLimitException rateLimitUnavailable() {
        return new AuthRateLimitException(
                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                ErrorCode.RATE_LIMIT_SERVICE_UNAVAILABLE,
                "Authentication rate limit service is temporarily unavailable."
        );
    }
}
