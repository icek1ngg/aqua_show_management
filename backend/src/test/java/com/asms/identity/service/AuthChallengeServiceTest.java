package com.asms.identity.service;

import com.asms.core.exception.BadRequestException;
import com.asms.identity.entity.AuthChallenge;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthChallengeType;
import com.asms.identity.repository.AuthChallengeRepository;
import com.asms.identity.security.AuthTokenCodec;
import com.asms.identity.service.impl.AuthChallengeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AuthChallengeServiceTest {

    private AuthChallengeRepository repository;
    private AuthTokenCodec codec;
    private AuthChallengeServiceImpl service;
    private User user;

    @BeforeEach
    void setUp() {
        repository = mock(AuthChallengeRepository.class);
        codec = new AuthTokenCodec();
        service = new AuthChallengeServiceImpl(repository, codec);
        user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        when(repository.save(any(AuthChallenge.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void issueInvalidatesOldChallengesAndReturnsNewChallenge() {
        AuthChallengeService.IssuedChallenge issued = service.issue(user, AuthChallengeType.EMAIL_VERIFICATION, Duration.ofMinutes(30));

        ArgumentCaptor<AuthChallenge> challengeCaptor = ArgumentCaptor.forClass(AuthChallenge.class);
        verify(repository).deleteByUserAndType(user, AuthChallengeType.EMAIL_VERIFICATION);
        verify(repository).save(challengeCaptor.capture());
        
        AuthChallenge saved = challengeCaptor.getValue();
        assertThat(saved.getTokenHash()).isEqualTo(issued.challenge().getTokenHash());
        assertThat(saved.getTokenHash()).isEqualTo(codec.hash(issued.rawToken()));
        assertThat(saved.getType()).isEqualTo(AuthChallengeType.EMAIL_VERIFICATION);
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(29));
    }

    @Test
    void consumeReturnsChallengeForValidToken() {
        String rawToken = "valid-token";
        AuthChallenge challenge = new AuthChallenge(user, AuthChallengeType.PASSWORD_RESET, codec.hash(rawToken), LocalDateTime.now().plusMinutes(15));
        
        when(repository.findByTokenHashForUpdate(codec.hash(rawToken))).thenReturn(Optional.of(challenge));

        AuthChallenge consumed = service.consume(rawToken, AuthChallengeType.PASSWORD_RESET);

        assertThat(consumed).isSameAs(challenge);
        assertThat(challenge.isUsed()).isTrue();
    }

    @Test
    void consumeRejectsMismatchedType() {
        String rawToken = "valid-token";
        AuthChallenge challenge = new AuthChallenge(user, AuthChallengeType.EMAIL_VERIFICATION, codec.hash(rawToken), LocalDateTime.now().plusMinutes(15));
        
        when(repository.findByTokenHashForUpdate(codec.hash(rawToken))).thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> service.consume(rawToken, AuthChallengeType.PASSWORD_RESET))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("type");
    }

    @Test
    void consumeRejectsExpiredToken() {
        String rawToken = "expired-token";
        AuthChallenge challenge = new AuthChallenge(user, AuthChallengeType.EMAIL_VERIFICATION, codec.hash(rawToken), LocalDateTime.now().minusMinutes(5));
        
        when(repository.findByTokenHashForUpdate(codec.hash(rawToken))).thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> service.consume(rawToken, AuthChallengeType.EMAIL_VERIFICATION))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void consumeRejectsUsedToken() {
        String rawToken = "used-token";
        AuthChallenge challenge = new AuthChallenge(user, AuthChallengeType.EMAIL_VERIFICATION, codec.hash(rawToken), LocalDateTime.now().plusMinutes(15));
        challenge.setUsedAt(LocalDateTime.now());
        
        when(repository.findByTokenHashForUpdate(codec.hash(rawToken))).thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> service.consume(rawToken, AuthChallengeType.EMAIL_VERIFICATION))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    void consumeRejectsInvalidToken() {
        String rawToken = "invalid-token";
        when(repository.findByTokenHashForUpdate(codec.hash(rawToken))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consume(rawToken, AuthChallengeType.EMAIL_VERIFICATION))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid challenge token");
    }

    @Test
    void invalidateCallsRepository() {
        service.invalidate(user, AuthChallengeType.EMAIL_VERIFICATION);
        verify(repository).deleteByUserAndType(user, AuthChallengeType.EMAIL_VERIFICATION);
    }
}
