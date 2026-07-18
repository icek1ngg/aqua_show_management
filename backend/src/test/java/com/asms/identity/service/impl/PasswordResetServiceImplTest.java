package com.asms.identity.service.impl;

import com.asms.core.exception.BadRequestException;
import com.asms.identity.entity.AuthChallenge;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthChallengeType;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.AuthChallengeService;
import com.asms.identity.service.AuthSessionService;
import com.asms.identity.service.PasswordResetMailEvents.PasswordChanged;
import com.asms.identity.service.PasswordResetMailEvents.ResetRequested;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith({MockitoExtension.class, OutputCaptureExtension.class})
class PasswordResetServiceImplTest {

    @Mock
    private AuthChallengeService challengeService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthSessionService authSessionService;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("LastName", "FirstName", "user@example.com", "123456789", "hash");
        user.setStatus(UserStatus.ACTIVE);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setAuthVersion(1);
    }

    @Test
    void requestPasswordReset_shouldIssueChallengeAndSendEmail() {
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        AuthChallenge challenge = mock(AuthChallenge.class);
        AuthChallengeService.IssuedChallenge issuedChallenge = new AuthChallengeService.IssuedChallenge(challenge, "test-token");
        when(challengeService.issue(eq(user), eq(AuthChallengeType.PASSWORD_RESET), any(Duration.class))).thenReturn(issuedChallenge);

        passwordResetService.requestPasswordReset("user@example.com");

        verify(challengeService).issue(eq(user), eq(AuthChallengeType.PASSWORD_RESET), any(Duration.class));
        verify(eventPublisher).publishEvent(new ResetRequested(user, "test-token"));
    }

    @Test
    void requestPasswordReset_shouldNotSendEmail_whenUserNotFound() {
        when(userRepository.findByEmailIgnoreCase("notfound@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestPasswordReset("notfound@example.com");

        verify(challengeService, never()).issue(any(), any(), any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void requestPasswordReset_shouldNotLogSubmittedEmail(CapturedOutput output) {
        when(userRepository.findByEmailIgnoreCase("private@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestPasswordReset("private@example.com");

        assertFalse(output.getOut().contains("private@example.com"));
    }

    @Test
    void requestPasswordReset_shouldNotSendEmail_whenUserGoogleOnly() {
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setPasswordHash(null);
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        passwordResetService.requestPasswordReset("user@example.com");

        verify(challengeService, never()).issue(any(), any(), any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void resetPassword_shouldConsumeChallengeUpdatePasswordAndRevokeSessions() {
        AuthChallenge challenge = mock(AuthChallenge.class);
        when(challenge.getUser()).thenReturn(user);
        when(challengeService.consume("test-token", AuthChallengeType.PASSWORD_RESET)).thenReturn(challenge);
        when(passwordEncoder.encode("newPassword123")).thenReturn("newHash");

        passwordResetService.resetPassword("test-token", "newPassword123");

        assertEquals("newHash", user.getPasswordHash());
        assertEquals(2, user.getAuthVersion());
        verify(authSessionService).revokeAll(user);
        verify(userRepository).save(user);
        verify(challengeService, never()).invalidate(user, AuthChallengeType.PASSWORD_RESET);
        verify(eventPublisher).publishEvent(new PasswordChanged(user));
    }

    @Test
    void resetPassword_shouldThrowException_whenUserGoogleOnly() {
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setPasswordHash(null);
        AuthChallenge challenge = mock(AuthChallenge.class);
        when(challenge.getUser()).thenReturn(user);
        when(challengeService.consume("test-token", AuthChallengeType.PASSWORD_RESET)).thenReturn(challenge);

        assertThrows(BadRequestException.class, () -> passwordResetService.resetPassword("test-token", "newPassword123"));

        verify(authSessionService, never()).revokeAll(any());
        verify(userRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }
}
