package com.asms.identity;

import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.UnauthorizedException;
import com.asms.core.exception.VerificationTokenException;
import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.service.VerificationChallengeService;
import com.asms.identity.service.AuthRateLimitService;
import com.asms.identity.service.VerificationEmailSender;
import com.asms.identity.service.AuthSessionService;

import com.asms.identity.service.impl.AuthServiceImpl;
import com.asms.identity.service.impl.EmailVerificationServiceImpl;
import com.asms.identity.service.impl.SmtpVerificationEmailSender;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailVerificationTest {

    private UserRepository userRepository;
    private VerificationChallengeService challengeService;
    private JavaMailSender mailSender;
    private VerificationEmailSender verificationEmailSender;
    private EmailVerificationServiceImpl verificationService;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthServiceImpl authService;
    private AuthRateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        challengeService = mock(VerificationChallengeService.class);
        mailSender = mock(JavaMailSender.class);
        verificationEmailSender = mock(VerificationEmailSender.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        rateLimitService = mock(AuthRateLimitService.class);

        verificationService = new EmailVerificationServiceImpl(
                challengeService,
                userRepository,
                verificationEmailSender,
                rateLimitService,
                Runnable::run
        );

        authService = new AuthServiceImpl(
                userRepository,
                passwordEncoder,
                jwtService,
                mock(AuthSessionService.class),
                mock(com.asms.identity.service.RegistrationPersistenceService.class),
                verificationEmailSender,
                rateLimitService
        );
    }

    @Test
    void sendVerificationEmailDeliversRawTokenWhileDelegatingPersistence() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        String issued = "raw-delivery-token";
        when(challengeService.rotate(user)).thenReturn(issued);

        verificationService.sendVerificationEmail(user);

        verify(challengeService).rotate(user);
        verify(verificationEmailSender).send(user, "raw-delivery-token");
    }

    @Test
    void smtpAdapterBuildsEncodedHtmlLinkWithoutUsingThePersistedHash() throws Exception {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        SmtpVerificationEmailSender smtpSender = new SmtpVerificationEmailSender(
                mailSender, "http://localhost:8080", "test@aquapulse.com"
        );

        smtpSender.send(user, "raw token+value");

        verify(mailSender).send(mimeMessage);
        MimeMultipart mixed = (MimeMultipart) mimeMessage.getContent();
        MimeMultipart related = (MimeMultipart) mixed.getBodyPart(0).getContent();
        String html = (String) related.getBodyPart(0).getContent();
        assertThat(html)
                .contains("token=raw+token%2Bvalue")
                .doesNotContain("raw token+value");
    }

    @Test
    void verifyEmailDelegatesRawTokenToChallengeService() {
        verificationService.verifyEmail("test-token");

        verify(challengeService).verify("test-token");
    }

    @Test
    void verifyEmailPreservesCodedChallengeFailure() {
        VerificationTokenException failure = new VerificationTokenException(
                ErrorCode.VERIFICATION_TOKEN_EXPIRED,
                VerificationTokenException.Result.EXPIRED,
                "Verification token has expired"
        );
        doThrow(failure).when(challengeService).verify("expired-token");

        assertThatThrownBy(() -> verificationService.verifyEmail("expired-token"))
                .isSameAs(failure);
    }

    @Test
    void loginRejectsPendingVerificationUser() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.PENDING_VERIFICATION);

        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "password")).thenReturn(true);

        LoginRequest request = new LoginRequest("user@example.com", "password");
        com.asms.identity.dto.SessionDtos.ClientContext context = new com.asms.identity.dto.SessionDtos.ClientContext("ua", "127.0.0.1");

        assertThatThrownBy(() -> authService.login(request, context))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Please verify your email before signing in.");
    }

    @Test
    void resendVerificationForPendingUserSendsEmail() throws Exception {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        String issued = "resend-token";
        when(challengeService.rotateIfPending(user.getId())).thenReturn(Optional.of(
                new VerificationChallengeService.PendingChallenge(user, issued)
        ));

        String result = verificationService.resendVerificationEmail("user@example.com");

        assertThat(result).isEqualTo(
                "If the email exists and requires verification, a verification email has been sent."
        );
        verify(challengeService).rotateIfPending(user.getId());
        verify(verificationEmailSender).send(user, "resend-token");
    }

    @Test
    void resendReturnsBeforeChallengeRotationAndDeliveryRun() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        String issued = "async-token";
        when(challengeService.rotateIfPending(user.getId())).thenReturn(Optional.of(
                new VerificationChallengeService.PendingChallenge(user, issued)
        ));
        AtomicReference<Runnable> queuedTask = new AtomicReference<>();
        EmailVerificationServiceImpl asyncService = new EmailVerificationServiceImpl(
                challengeService,
                userRepository,
                verificationEmailSender,
                rateLimitService,
                queuedTask::set
        );

        assertThat(asyncService.resendVerificationEmail("user@example.com"))
                .isEqualTo("If the email exists and requires verification, a verification email has been sent.");
        assertThat(queuedTask.get()).isNotNull();
        verifyNoInteractions(challengeService, verificationEmailSender);

        queuedTask.get().run();

        verify(challengeService).rotateIfPending(user.getId());
        verify(verificationEmailSender).send(user, "async-token");
    }

    @Test
    void resendVerificationForActiveUserReturnsAlreadyVerified() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        String result = verificationService.resendVerificationEmail("user@example.com");

        assertThat(result).isEqualTo(
                "If the email exists and requires verification, a verification email has been sent."
        );
        verifyNoInteractions(challengeService, verificationEmailSender);
    }

    @Test
    void resendVerificationForNonexistentUserReturnsGenericSuccess() {
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        String result = verificationService.resendVerificationEmail("nonexistent@example.com");

        assertThat(result).isEqualTo(
                "If the email exists and requires verification, a verification email has been sent."
        );
        verifyNoInteractions(challengeService, verificationEmailSender);
    }

    @Test
    void resendVerificationForDisabledUserReturnsGenericSuccess() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.DISABLED);

        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        assertThat(verificationService.resendVerificationEmail("user@example.com"))
                .isEqualTo("If the email exists and requires verification, a verification email has been sent.");
        
        verifyNoInteractions(challengeService, verificationEmailSender);
    }
}
