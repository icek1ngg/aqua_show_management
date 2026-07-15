package com.asms.identity;

import com.asms.core.exception.BadRequestException;
import com.asms.identity.controller.AuthController;
import com.asms.identity.dto.AuthDtos.ForgotPasswordRequest;
import com.asms.identity.dto.AuthDtos.ResetPasswordRequest;
import com.asms.identity.entity.AuthChallenge;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthChallengeType;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.service.AuthChallengeService;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.RefreshTokenCookieService;
import com.asms.identity.service.impl.PasswordResetServiceImpl;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PasswordResetTest {

    private UserRepository userRepository;
    private AuthChallengeService challengeService;
    private com.asms.identity.service.PasswordResetEmailSender emailSender;
    private PasswordEncoder passwordEncoder;
    private PasswordResetServiceImpl passwordResetService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        challengeService = mock(AuthChallengeService.class);
        emailSender = mock(com.asms.identity.service.PasswordResetEmailSender.class);
        passwordEncoder = mock(PasswordEncoder.class);

        com.asms.identity.service.AuthSessionService authSessionService = mock(com.asms.identity.service.AuthSessionService.class);

        passwordResetService = new PasswordResetServiceImpl(
                challengeService,
                userRepository,
                emailSender,
                passwordEncoder,
                authSessionService
        );
    }

    @Test
    void requestResetForValidLocalUserSendsEmail() throws Exception {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "hashedPassword");
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findByEmailIgnoreCase("local@example.com")).thenReturn(Optional.of(user));

        when(challengeService.issue(eq(user), eq(AuthChallengeType.PASSWORD_RESET), any()))
                .thenReturn(new AuthChallengeService.IssuedChallenge(mock(AuthChallenge.class), "mocked-token"));

        passwordResetService.requestPasswordReset("local@example.com");

        verify(emailSender).sendPasswordResetEmail(user, "mocked-token");
    }

    @Test
    void requestResetForNonexistentEmailDoesNotSendEmail() {
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestPasswordReset("nonexistent@example.com");

        verifyNoInteractions(challengeService, emailSender);
    }

    @Test
    void requestResetForGoogleOnlyAccountDoesNotSendEmail() {
        User user = new User("Nguyen", "Van A", "google@example.com", "0909123456", null);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findByEmailIgnoreCase("google@example.com")).thenReturn(Optional.of(user));

        passwordResetService.requestPasswordReset("google@example.com");

        verifyNoInteractions(challengeService, emailSender);
    }

    @Test
    void requestResetForInactiveOrDisabledUserDoesNotSendEmail() {
        User user = new User("Nguyen", "Van A", "disabled@example.com", "0909123456", "hashedPassword");
        user.setStatus(UserStatus.DISABLED);

        when(userRepository.findByEmailIgnoreCase("disabled@example.com")).thenReturn(Optional.of(user));

        passwordResetService.requestPasswordReset("disabled@example.com");

        verifyNoInteractions(challengeService, emailSender);
    }

    @Test
    void resetPasswordWithValidTokenUpdatesPasswordAndMarksTokenUsed() {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "oldHashedPassword");
        user.setStatus(UserStatus.ACTIVE);
        AuthChallenge challenge = new AuthChallenge(user, AuthChallengeType.PASSWORD_RESET, "hash", LocalDateTime.now().plusMinutes(15));

        when(challengeService.consume("valid-token", AuthChallengeType.PASSWORD_RESET)).thenReturn(challenge);
        when(passwordEncoder.encode("newPassword")).thenReturn("newHashedPassword");

        passwordResetService.resetPassword("valid-token", "newPassword");

        assertThat(user.getPasswordHash()).isEqualTo("newHashedPassword");
        verify(userRepository).save(user);
        verify(challengeService).invalidate(user, AuthChallengeType.PASSWORD_RESET);
    }

    @Test
    void resetPasswordKeepsPendingVerificationStatus() {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "hashedPassword");
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        AuthChallenge challenge = new AuthChallenge(user, AuthChallengeType.PASSWORD_RESET, "hash", LocalDateTime.now().plusMinutes(15));

        when(challengeService.consume("pending-token", AuthChallengeType.PASSWORD_RESET)).thenReturn(challenge);
        when(passwordEncoder.encode("newPassword")).thenReturn("newHashed");

        passwordResetService.resetPassword("pending-token", "newPassword");

        assertThat(user.getStatus()).isEqualTo(UserStatus.PENDING_VERIFICATION);
    }


    @Test
    void resetPasswordKeepsActiveStatus() {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "hashedPassword");
        user.setStatus(UserStatus.ACTIVE);
        AuthChallenge challenge = new AuthChallenge(user, AuthChallengeType.PASSWORD_RESET, "hash", LocalDateTime.now().plusMinutes(15));

        when(challengeService.consume("active-token", AuthChallengeType.PASSWORD_RESET)).thenReturn(challenge);
        when(passwordEncoder.encode("newPassword")).thenReturn("newHashed");

        passwordResetService.resetPassword("active-token", "newPassword");

        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    void authControllerMismatchedConfirmPasswordThrowsException() {
        AuthController authController = new AuthController(
                mock(com.asms.identity.service.AuthService.class),
                mock(com.asms.identity.service.EmailVerificationService.class),
                passwordResetService,
                mock(RefreshTokenCookieService.class),
                mock(com.asms.identity.service.OAuthOnboardingService.class),
                mock(com.asms.identity.service.AuthRateLimitService.class),
                "http://localhost:5173"
        );

        ResetPasswordRequest request = new ResetPasswordRequest("token", "newPassword", "differentPassword");

        assertThatThrownBy(() -> authController.resetPassword(request, mock(jakarta.servlet.http.HttpServletRequest.class)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Password confirmation does not match");
    }
}
