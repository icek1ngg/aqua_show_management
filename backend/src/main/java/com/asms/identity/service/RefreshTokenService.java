package com.asms.identity.service;

import com.asms.identity.entity.User;

public interface RefreshTokenService {

    RefreshTokenIssue createRefreshToken(User user, boolean rememberMe);

    User validateRefreshToken(String rawRefreshToken);

    RefreshTokenRotation rotateRefreshToken(String rawRefreshToken);

    void revokeRefreshToken(String rawRefreshToken);

    record RefreshTokenIssue(String token, long cookieMaxAgeSeconds) {
    }

    record RefreshTokenRotation(String token, long cookieMaxAgeSeconds, User user) {
    }
}
