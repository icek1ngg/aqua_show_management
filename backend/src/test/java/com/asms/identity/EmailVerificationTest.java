package com.asms.identity;

import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.entity.EmailVerificationToken;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.EmailVerificationTokenRepository;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.service.impl.AuthServiceImpl;
import com.asms.identity.service.impl.EmailVerificationServiceImpl;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailVerificationTest {

    private UserRepository userRepository;
    private EmailVerificationTokenRepository tokenRepository;
    private JavaMailSender mailSender;
    private EmailVerificationServiceImpl verificationService;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        tokenRepository = mock(EmailVerificationTokenRepository.class);
        mailSender = mock(JavaMailSender.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);

        verificationService = new EmailVerificationServiceImpl(tokenRepository, userRepository, mailSender);
        ReflectionTestUtils.setField(verificationService, "backendBaseUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(verificationService, "fromEmail", "test@aquapulse.com");

        authService = new AuthServiceImpl(userRepository, passwordEncoder, jwtService, verificationService);
    }

    @Test
    void sendVerificationEmailGeneratesAndSavesToken() throws Exception {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        verificationService.sendVerificationEmail(user);

        verify(tokenRepository).deleteByUser(user);
        verify(tokenRepository).save(any(EmailVerificationToken.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void verifyEmailTransitionsStatusToActive() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        EmailVerificationToken token = new EmailVerificationToken(user, "test-token", 30);

        when(tokenRepository.findByToken("test-token")).thenReturn(Optional.of(token));

        verificationService.verifyEmail("test-token");

        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(token.isUsed()).isTrue();
        verify(tokenRepository).save(token);
        verify(userRepository).save(user);
    }

    @Test
    void verifyEmailThrowsExceptionForExpiredToken() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        EmailVerificationToken token = new EmailVerificationToken(user, "expired-token", -10); // already expired

        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> verificationService.verifyEmail("expired-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void loginRejectsPendingVerificationUser() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.PENDING_VERIFICATION);

        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest("user@example.com", "password");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Please verify your email before signing in.");
    }

    @Test
    void resendVerificationForPendingUserSendsEmail() throws Exception {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        MimeMessage mimeMessage = mock(MimeMessage.class);
        
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        String result = verificationService.resendVerificationEmail("user@example.com");

        assertThat(result).isEqualTo("Verification email has been sent.");
        verify(tokenRepository).deleteByUser(user);
        verify(tokenRepository).save(any(EmailVerificationToken.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void resendVerificationForActiveUserReturnsAlreadyVerified() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        String result = verificationService.resendVerificationEmail("user@example.com");

        assertThat(result).isEqualTo("Account is already verified.");
        verifyNoInteractions(tokenRepository, mailSender);
    }

    @Test
    void resendVerificationForNonexistentUserReturnsGenericSuccess() {
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        String result = verificationService.resendVerificationEmail("nonexistent@example.com");

        assertThat(result).isEqualTo("If the email exists and is not verified, a verification email has been sent.");
        verifyNoInteractions(tokenRepository, mailSender);
    }

    @Test
    void resendVerificationForDisabledUserThrowsBadRequestException() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        user.setStatus(UserStatus.DISABLED);

        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> verificationService.resendVerificationEmail("user@example.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Account is not eligible for email verification.");
        
        verifyNoInteractions(tokenRepository, mailSender);
    }
}
