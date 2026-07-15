package com.asms.identity.service.impl;

import com.asms.core.exception.UnauthorizedException;
import com.asms.core.exception.ErrorCode;
import com.asms.identity.dto.SessionDtos.ClientContext;
import com.asms.identity.dto.SessionDtos.SessionIssue;
import com.asms.identity.dto.SessionDtos.SessionRotation;
import com.asms.identity.dto.SessionDtos.SessionView;
import com.asms.identity.entity.AuthSession;
import com.asms.identity.entity.User;
import com.asms.identity.repository.AuthSessionRepository;
import com.asms.identity.security.RefreshTokenCodec;
import com.asms.identity.service.AuthSessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthSessionServiceImpl implements AuthSessionService {

    private final AuthSessionRepository authSessionRepository;
    private final RefreshTokenCodec refreshTokenCodec;
    private final long shortLivedSeconds;
    private final long rememberMeSeconds;

    public AuthSessionServiceImpl(
            AuthSessionRepository authSessionRepository,
            RefreshTokenCodec refreshTokenCodec,
            @Value("${asms.jwt.refresh-token.short-lived-seconds}") long shortLivedSeconds,
            @Value("${asms.jwt.refresh-token.remember-me-seconds}") long rememberMeSeconds
    ) {
        this.authSessionRepository = authSessionRepository;
        this.refreshTokenCodec = refreshTokenCodec;
        this.shortLivedSeconds = shortLivedSeconds;
        this.rememberMeSeconds = rememberMeSeconds;
    }

    @Override
    @Transactional
    public SessionIssue create(User user, boolean rememberMe, ClientContext context) {
        long lifetimeSeconds = rememberMe ? rememberMeSeconds : shortLivedSeconds;
        Instant expiresAt = Instant.now().plusSeconds(lifetimeSeconds);
        
        AuthSession session = new AuthSession(
                user,
                UUID.randomUUID().toString(), 
                expiresAt,
                context.userAgent() != null ? truncate(context.userAgent(), 255) : null,
                context.ipAddress() != null ? truncate(context.ipAddress(), 45) : null
        );
        session = authSessionRepository.saveAndFlush(session);
        
        String rawToken = refreshTokenCodec.generateToken(session.getId(), session.getGeneration());
        session.setCurrentTokenHash(refreshTokenCodec.hash(rawToken));
        authSessionRepository.save(session);

        return new SessionIssue(rawToken, rememberMe ? lifetimeSeconds : -1, session.getId().toString());
    }

    @Override
    @Transactional
    public SessionRotation rotate(String rawRefreshToken, ClientContext context) {
        RefreshTokenCodec.DecodedToken decodedToken;
        try {
            decodedToken = refreshTokenCodec.decode(rawRefreshToken);
        } catch (IllegalArgumentException e) {
            throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_INVALID, "Invalid refresh token");
        }

        AuthSession session = authSessionRepository.findByIdForUpdate(decodedToken.sessionId())
                .orElseThrow(() -> new UnauthorizedException(
                        ErrorCode.AUTH_SESSION_REVOKED,
                        "Authentication session is no longer active"
                ));

        if (!session.getExpiresAt().isAfter(Instant.now())) {
            authSessionRepository.delete(session);
            throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_EXPIRED, "Refresh token has expired");
        }

        String providedHash = refreshTokenCodec.hash(rawRefreshToken);

        boolean tokenHashMatches = MessageDigest.isEqual(
                providedHash.getBytes(StandardCharsets.UTF_8),
                session.getCurrentTokenHash().getBytes(StandardCharsets.UTF_8)
        );
        if (decodedToken.generation() != session.getGeneration() || !tokenHashMatches) {
            if (decodedToken.generation() < session.getGeneration()) {
                authSessionRepository.delete(session);
                throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_REUSED, "Refresh token reuse detected");
            } else {
                throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_INVALID, "Invalid refresh token generation");
            }
        }

        User user = session.getUser();
        if (!user.isEnabled()) {
            throw new UnauthorizedException("User is disabled");
        }

        session.setGeneration(session.getGeneration() + 1);
        session.setLastSeenAt(Instant.now());
        
        if (context.userAgent() != null) {
            session.setDevice(truncate(context.userAgent(), 255));
        }
        if (context.ipAddress() != null) {
            session.setIpPrefix(truncate(context.ipAddress(), 45));
        }

        String nextRawToken = refreshTokenCodec.generateToken(session.getId(), session.getGeneration());
        session.setCurrentTokenHash(refreshTokenCodec.hash(nextRawToken));
        authSessionRepository.save(session);

        long remainingSeconds = Math.max(0, Duration.between(Instant.now(), session.getExpiresAt()).toSeconds());
        
        return new SessionRotation(nextRawToken, remainingSeconds, user, session.getId().toString());
    }

    @Override
    @Transactional
    public void revoke(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        try {
            RefreshTokenCodec.DecodedToken decodedToken = refreshTokenCodec.decode(rawRefreshToken);
            authSessionRepository.findByIdForUpdate(decodedToken.sessionId())
                    .ifPresent(session -> {
                        if (session.getCurrentTokenHash().equals(refreshTokenCodec.hash(rawRefreshToken))) {
                            authSessionRepository.delete(session);
                        }
                    });
        } catch (Exception ignored) {
        }
    }

    @Override
    @Transactional
    public void revokeSession(User user, UUID sessionId) {
        authSessionRepository.deleteByUserAndId(user, sessionId);
    }

    @Override
    @Transactional
    public void revokeAll(User user) {
        authSessionRepository.deleteByUser(user);
    }

    @Override
    @Transactional
    public void revokeAllExceptCurrent(User user, UUID currentSessionId) {
        authSessionRepository.deleteByUserAndIdNot(user, currentSessionId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionView> list(User user, UUID currentSessionId) {
        return authSessionRepository.findByUserOrderByLastSeenAtDesc(user).stream()
                .map(session -> new SessionView(
                        session.getId(),
                        session.getCreatedAt(),
                        session.getLastSeenAt(),
                        session.getDevice(),
                        session.getIpPrefix(),
                        session.getId().equals(currentSessionId)
                ))
                .collect(Collectors.toList());
    }

    private String truncate(String value, int length) {
        if (value == null) return null;
        return value.length() > length ? value.substring(0, length) : value;
    }
}
