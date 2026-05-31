package com.asms.identity;

import com.asms.core.exception.BadRequestException;
import com.asms.identity.controller.AuthController;
import com.asms.identity.dto.AuthDtos.ForgotPasswordRequest;
import com.asms.identity.dto.AuthDtos.ResetPasswordRequest;
import com.asms.identity.entity.PasswordResetToken;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.PasswordResetTokenRepository;
import com.asms.identity.repository.UserRepository;
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
    private PasswordResetTokenRepository tokenRepository;
    private JavaMailSender mailSender;
    private PasswordEncoder passwordEncoder;
    private PasswordResetServiceImpl passwordResetService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        tokenRepository = mock(PasswordResetTokenRepository.class);
        mailSender = mock(JavaMailSender.class);
        passwordEncoder = mock(PasswordEncoder.class);

        passwordResetService = new PasswordResetServiceImpl(
                tokenRepository,
                userRepository,
                mailSender,
                passwordEncoder
        );
        ReflectionTestUtils.setField(passwordResetService, "frontendBaseUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(passwordResetService, "fromEmail", "test@aquapulse.com");
    }

    @Test
    void requestResetForValidLocalUserSendsEmail() throws Exception {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "hashedPassword");
        user.setStatus(UserStatus.ACTIVE);

        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(userRepository.findByEmailIgnoreCase("local@example.com")).thenReturn(Optional.of(user));

        passwordResetService.requestPasswordReset("local@example.com");

        verify(tokenRepository).deleteByUser(user);
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void requestResetForNonexistentEmailDoesNotSendEmail() {
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestPasswordReset("nonexistent@example.com");

        verifyNoInteractions(tokenRepository, mailSender);
    }

    @Test
    void requestResetForGoogleOnlyAccountDoesNotSendEmail() {
        User user = new User("Nguyen", "Van A", "google@example.com", "0909123456", null);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findByEmailIgnoreCase("google@example.com")).thenReturn(Optional.of(user));

        passwordResetService.requestPasswordReset("google@example.com");

        verifyNoInteractions(tokenRepository, mailSender);
    }

    @Test
    void requestResetForInactiveOrDisabledUserDoesNotSendEmail() {
        User user = new User("Nguyen", "Van A", "disabled@example.com", "0909123456", "hashedPassword");
        user.setStatus(UserStatus.DISABLED);

        when(userRepository.findByEmailIgnoreCase("disabled@example.com")).thenReturn(Optional.of(user));

        passwordResetService.requestPasswordReset("disabled@example.com");

        verifyNoInteractions(tokenRepository, mailSender);
    }

    @Test
    void resetPasswordWithValidTokenUpdatesPasswordAndMarksTokenUsed() {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "oldHashedPassword");
        user.setStatus(UserStatus.ACTIVE);
        PasswordResetToken token = new PasswordResetToken(user, "valid-token", 15);

        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newPassword")).thenReturn("newHashedPassword");

        passwordResetService.resetPassword("valid-token", "newPassword");

        assertThat(user.getPasswordHash()).isEqualTo("newHashedPassword");
        assertThat(token.isUsed()).isTrue();
        verify(userRepository).save(user);
        verify(tokenRepository).save(token);
        verify(tokenRepository).deleteByUserAndIdNot(user, token.getId());
    }

    @Test
    void resetPasswordThrowsExceptionForExpiredToken() {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "hashedPassword");
        PasswordResetToken token = new PasswordResetToken(user, "expired-token", -10);

        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("expired-token", "newPassword"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void resetPasswordThrowsExceptionForUsedToken() {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "hashedPassword");
        PasswordResetToken token = new PasswordResetToken(user, "used-token", 15);
        token.setUsedAt(LocalDateTime.now());

        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("used-token", "newPassword"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    void resetPasswordKeepsPendingVerificationStatus() {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "hashedPassword");
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        PasswordResetToken token = new PasswordResetToken(user, "pending-token", 15);

        when(tokenRepository.findByToken("pending-token")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newPassword")).thenReturn("newHashed");

        passwordResetService.resetPassword("pending-token", "newPassword");

        assertThat(user.getStatus()).isEqualTo(UserStatus.PENDING_VERIFICATION);
    }

    @Test
    void resetPasswordKeepsActiveStatus() {
        User user = new User("Nguyen", "Van A", "local@example.com", "0909123456", "hashedPassword");
        user.setStatus(UserStatus.ACTIVE);
        PasswordResetToken token = new PasswordResetToken(user, "active-token", 15);

        when(tokenRepository.findByToken("active-token")).thenReturn(Optional.of(token));
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
                "http://localhost:5173"
        );

        ResetPasswordRequest request = new ResetPasswordRequest("token", "newPassword", "differentPassword");

        assertThatThrownBy(() -> authController.resetPassword(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Password confirmation does not match");
    }
}
