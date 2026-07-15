package com.asms.identity.service;

import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.VerificationTokenException;
import com.asms.identity.entity.EmailVerificationToken;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.EmailVerificationTokenRepository;
import com.asms.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.InOrder;

class VerificationChallengeServiceTest {

    private EmailVerificationTokenRepository repository;
    private VerificationTokenCodec codec;
    private UserRepository userRepository;
    private VerificationChallengeService service;
    private User user;

    @BeforeEach
    void setUp() {
        repository = mock(EmailVerificationTokenRepository.class);
        userRepository = mock(UserRepository.class);
        codec = new VerificationTokenCodec();
        service = new VerificationChallengeService(repository, codec, userRepository);
        user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        when(userRepository.findByIdForUpdate(user.getId())).thenReturn(Optional.of(user));
    }

    @Test
    void rotateDeletesOldTokensAndPersistsOnlyTheHash() {
        VerificationTokenCodec.IssuedToken issued = service.rotate(user);

        ArgumentCaptor<EmailVerificationToken> tokenCaptor =
                ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(repository).deleteByUser(user);
        verify(repository).save(tokenCaptor.capture());
        assertThat(tokenCaptor.getValue().getTokenHash()).isEqualTo(issued.tokenHash());
        assertThat(tokenCaptor.getValue().getTokenHash()).isNotEqualTo(issued.rawToken());
        assertThat(tokenCaptor.getValue().getExpiresAt())
                .isAfter(LocalDateTime.now().plusMinutes(29));
    }

    @Test
    void verifyActivatesAUserForAValidToken() {
        String rawToken = "valid-token";
        EmailVerificationToken token = token(rawToken, 30);
        prepareLookup(rawToken, token);

        service.verify(rawToken);

        assertThat(token.getUsedAt()).isNotNull();
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);

        InOrder order = inOrder(repository, userRepository);
        order.verify(repository).findUserIdByTokenHash(codec.hash(rawToken));
        order.verify(userRepository).findByIdForUpdate(user.getId());
        order.verify(repository).findByTokenHash(codec.hash(rawToken));
    }

    @Test
    void rotateIfPendingDoesNotIssueForAnAccountActivatedBeforeTheLock() {
        user.setStatus(UserStatus.ACTIVE);

        assertThat(service.rotateIfPending(user.getId())).isEmpty();

        verify(repository, never()).deleteByUser(user);
        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void verifyRejectsAnExpiredTokenWithCodedException() {
        String rawToken = "expired-token";
        prepareLookup(rawToken, token(rawToken, -1));

        assertThatThrownBy(() -> service.verify(rawToken))
                .isInstanceOfSatisfying(VerificationTokenException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.VERIFICATION_TOKEN_EXPIRED);
                    assertThat(exception.getResult()).isEqualTo(VerificationTokenException.Result.EXPIRED);
                });
    }

    @Test
    void verifyRejectsAUsedTokenBeforeCheckingExpiry() {
        String rawToken = "used-token";
        EmailVerificationToken token = token(rawToken, -1);
        token.setUsedAt(LocalDateTime.now().minusMinutes(2));
        prepareLookup(rawToken, token);

        assertThatThrownBy(() -> service.verify(rawToken))
                .isInstanceOfSatisfying(VerificationTokenException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.VERIFICATION_TOKEN_USED);
                    assertThat(exception.getResult()).isEqualTo(VerificationTokenException.Result.USED);
                });
    }

    @Test
    void verifyRejectsAMissingHashWithCodedException() {
        String rawToken = "missing-token";
        when(repository.findUserIdByTokenHash(codec.hash(rawToken))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verify(rawToken))
                .isInstanceOfSatisfying(VerificationTokenException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.VERIFICATION_TOKEN_INVALID);
                    assertThat(exception.getResult()).isEqualTo(VerificationTokenException.Result.INVALID);
                });
    }

    private EmailVerificationToken token(String rawToken, int expiryMinutes) {
        return new EmailVerificationToken(user, codec.hash(rawToken), expiryMinutes);
    }

    private void prepareLookup(String rawToken, EmailVerificationToken token) {
        String tokenHash = codec.hash(rawToken);
        when(repository.findUserIdByTokenHash(tokenHash)).thenReturn(Optional.of(user.getId()));
        when(repository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));
    }
}
