package com.asms.identity.service.impl;

import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.entity.RefreshToken;
import com.asms.identity.entity.User;
import com.asms.identity.repository.RefreshTokenRepository;
import com.asms.identity.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final int TOKEN_BYTES = 48;

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long shortLivedSeconds;
    private final long rememberMeSeconds;

    public RefreshTokenServiceImpl(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${asms.jwt.refresh-token.short-lived-seconds}") long shortLivedSeconds,
            @Value("${asms.jwt.refresh-token.remember-me-seconds}") long rememberMeSeconds
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.shortLivedSeconds = shortLivedSeconds;
        this.rememberMeSeconds = rememberMeSeconds;
    }

    @Override
    @Transactional
    public RefreshTokenIssue createRefreshToken(User user, boolean rememberMe) {
        String rawToken = generateOpaqueToken();
        long lifetimeSeconds = rememberMe ? rememberMeSeconds : shortLivedSeconds;
        RefreshToken refreshToken = new RefreshToken(
                user,
                hash(rawToken),
                Instant.now().plusSeconds(lifetimeSeconds)
        );
        refreshTokenRepository.save(refreshToken);

        return new RefreshTokenIssue(rawToken, rememberMe ? lifetimeSeconds : -1);
    }

    @Override
    @Transactional(readOnly = true)
    public User validateRefreshToken(String rawRefreshToken) {
        RefreshToken refreshToken = findRefreshToken(rawRefreshToken);

        if (refreshToken.isRevoked() || !refreshToken.getExpiresAt().isAfter(Instant.now())) {
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }

        User user = refreshToken.getUser();
        if (!user.isEnabled()) {
            throw new UnauthorizedException("Refresh token user is disabled");
        }

        return user;
    }

    @Override
    @Transactional
    public RefreshTokenRotation rotateRefreshToken(String rawRefreshToken) {
        RefreshToken currentToken = findRefreshToken(rawRefreshToken);
        User user = currentToken.getUser();

        if (currentToken.isRevoked()) {
            refreshTokenRepository.revokeActiveRefreshTokensByUser(user);
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }

        Instant now = Instant.now();
        if (!currentToken.getExpiresAt().isAfter(now)) {
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }

        if (!user.isEnabled()) {
            throw new UnauthorizedException("Refresh token user is disabled");
        }

        currentToken.revoke();
        refreshTokenRepository.save(currentToken);

        String nextRawToken = generateOpaqueToken();
        RefreshToken nextToken = new RefreshToken(user, hash(nextRawToken), currentToken.getExpiresAt());
        refreshTokenRepository.save(nextToken);

        return new RefreshTokenRotation(
                nextRawToken,
                Math.max(0, Duration.between(now, currentToken.getExpiresAt()).toSeconds()),
                user
        );
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .ifPresent(refreshToken -> {
                    refreshToken.revoke();
                    refreshTokenRepository.save(refreshToken);
                });
    }

    private RefreshToken findRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is missing");
        }

        return refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid"));
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash refresh token", exception);
        }
    }
}
