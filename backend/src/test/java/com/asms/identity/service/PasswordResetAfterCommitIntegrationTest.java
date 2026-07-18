package com.asms.identity.service;

import com.asms.core.exception.ErrorCode;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthChallengeType;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.AuthTokenCodec;
import com.asms.identity.service.impl.AuthChallengeServiceImpl;
import com.asms.identity.service.impl.PasswordResetMailEventListener;
import com.asms.identity.service.impl.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.transaction.TestTransaction;

import java.time.Duration;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@DataJpaTest
@Import({
        PasswordResetServiceImpl.class,
        PasswordResetMailEventListener.class,
        AuthChallengeServiceImpl.class,
        AuthTokenCodec.class
})
class PasswordResetAfterCommitIntegrationTest {

    @Autowired private PasswordResetService passwordResetService;
    @Autowired private AuthChallengeService authChallengeService;
    @Autowired private UserRepository userRepository;

    @MockBean private PasswordResetEmailSender emailSender;
    @MockBean private PasswordEncoder passwordEncoder;
    @MockBean private AuthSessionService authSessionService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User(
                "Nguyen",
                "Van A",
                "after-commit-" + UUID.randomUUID() + "@example.com",
                "0909123456",
                "old-hash"
        );
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.saveAndFlush(user);
    }

    @Test
    void resetLinkEmail_shouldBeDeliveredOnlyAfterCommit() {
        passwordResetService.requestPasswordReset(user.getEmail());

        verifyNoInteractions(emailSender);

        TestTransaction.flagForCommit();
        TestTransaction.end();

        verify(emailSender).sendPasswordResetEmail(eq(user), any(String.class));
    }

    @Test
    void rolledBackResetRequest_shouldNotDeliverResetLinkEmail() {
        passwordResetService.requestPasswordReset(user.getEmail());

        TestTransaction.flagForRollback();
        TestTransaction.end();

        verifyNoInteractions(emailSender);
    }

    @Test
    void passwordChangedEmail_shouldBeDeliveredOnlyAfterCommit() {
        String token = authChallengeService.issue(
                user,
                AuthChallengeType.PASSWORD_RESET,
                Duration.ofMinutes(15)
        ).rawToken();
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hash");

        passwordResetService.resetPassword(token, "newPassword123");

        assertEquals(1L, user.getAuthVersion());
        verify(authSessionService).revokeAll(user);
        verify(emailSender, never()).sendPasswordChangedEmail(any());

        TestTransaction.flagForCommit();
        TestTransaction.end();

        verify(emailSender).sendPasswordChangedEmail(user);
    }

    @Test
    void rolledBackReset_shouldNotDeliverPasswordChangedEmail() {
        String token = authChallengeService.issue(
                user,
                AuthChallengeType.PASSWORD_RESET,
                Duration.ofMinutes(15)
        ).rawToken();
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hash");

        passwordResetService.resetPassword(token, "newPassword123");

        TestTransaction.flagForRollback();
        TestTransaction.end();

        verify(emailSender, never()).sendPasswordChangedEmail(any());
    }

    @Test
    void committedResetTokenReplay_shouldReturnUsedCode() {
        String token = authChallengeService.issue(
                user,
                AuthChallengeType.PASSWORD_RESET,
                Duration.ofMinutes(15)
        ).rawToken();
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hash");
        passwordResetService.resetPassword(token, "newPassword123");

        TestTransaction.flagForCommit();
        TestTransaction.end();
        TestTransaction.start();

        assertThatThrownBy(() -> passwordResetService.resetPassword(token, "anotherPassword123"))
                .extracting("code")
                .isEqualTo(ErrorCode.RESET_TOKEN_USED);
    }
}
