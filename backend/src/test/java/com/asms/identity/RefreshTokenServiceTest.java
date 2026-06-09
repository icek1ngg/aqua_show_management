package com.asms.identity;

import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.entity.RefreshToken;
import com.asms.identity.entity.User;
import com.asms.identity.repository.RefreshTokenRepository;
import com.asms.identity.service.RefreshTokenService.RefreshTokenIssue;
import com.asms.identity.service.RefreshTokenService.RefreshTokenRotation;
import com.asms.identity.service.impl.RefreshTokenServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RefreshTokenServiceTest {

    private RefreshTokenRepository refreshTokenRepository;
    private RefreshTokenServiceImpl refreshTokenService;
    private List<RefreshToken> savedTokens;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        savedTokens = new ArrayList<>();
        refreshTokenService = new RefreshTokenServiceImpl(refreshTokenRepository, 60, 2_592_000);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken token = invocation.getArgument(0);
            if (!savedTokens.contains(token)) {
                savedTokens.add(token);
            }
            return token;
        });
        when(refreshTokenRepository.findByTokenHash(anyString())).thenAnswer(invocation -> {
            String hash = invocation.getArgument(0);
            return savedTokens.stream()
                    .filter(token -> token.getTokenHash().equals(hash))
                    .findFirst();
        });
    }

    @Test
    void createRefreshTokenStoresOnlyHashAndValidatesRawToken() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hash");

        RefreshTokenIssue issuedToken = refreshTokenService.createRefreshToken(user, true);

        assertThat(issuedToken.token()).isNotBlank();
        assertThat(issuedToken.cookieMaxAgeSeconds()).isEqualTo(2_592_000);
        assertThat(savedTokens.getFirst().getTokenHash()).isNotEqualTo(issuedToken.token());
        assertThat(refreshTokenService.validateRefreshToken(issuedToken.token())).isSameAs(user);
    }

    @Test
    void revokedRefreshTokenIsRejected() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hash");
        RefreshTokenIssue issuedToken = refreshTokenService.createRefreshToken(user, false);

        refreshTokenService.revokeRefreshToken(issuedToken.token());

        assertThat(savedTokens.getFirst().isRevoked()).isTrue();
        assertThatThrownBy(() -> refreshTokenService.validateRefreshToken(issuedToken.token()))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void rotateRefreshTokenRevokesOldTokenAndKeepsOriginalExpiration() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hash");
        RefreshTokenIssue issuedToken = refreshTokenService.createRefreshToken(user, true);
        RefreshToken oldRecord = savedTokens.getFirst();

        RefreshTokenRotation rotatedToken = refreshTokenService.rotateRefreshToken(issuedToken.token());

        RefreshToken newRecord = savedTokens.getLast();
        assertThat(rotatedToken.token()).isNotBlank().isNotEqualTo(issuedToken.token());
        assertThat(rotatedToken.cookieMaxAgeSeconds()).isLessThanOrEqualTo(2_592_000).isGreaterThan(2_592_000 - 5);
        assertThat(oldRecord.isRevoked()).isTrue();
        assertThat(newRecord).isNotSameAs(oldRecord);
        assertThat(newRecord.getTokenHash()).isNotEqualTo(rotatedToken.token());
        assertThat(newRecord.getExpiresAt()).isEqualTo(oldRecord.getExpiresAt());
        assertThat(refreshTokenService.validateRefreshToken(rotatedToken.token())).isSameAs(user);
    }

    @Test
    void revokedRefreshTokenReuseRevokesAllActiveTokensForSameUser() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hash");
        RefreshTokenIssue issuedToken = refreshTokenService.createRefreshToken(user, true);

        refreshTokenService.rotateRefreshToken(issuedToken.token());

        assertThatThrownBy(() -> refreshTokenService.rotateRefreshToken(issuedToken.token()))
                .isInstanceOf(UnauthorizedException.class);
        verify(refreshTokenRepository).revokeActiveRefreshTokensByUser(user);
    }
}
