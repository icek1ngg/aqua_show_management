package com.asms.identity.service;

import com.asms.identity.entity.AuthChallenge;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthChallengeType;

import java.time.Duration;

public interface AuthChallengeService {
    IssuedChallenge issue(User user, AuthChallengeType type, Duration lifetime);
    AuthChallenge consume(String rawToken, AuthChallengeType expectedType);
    void invalidate(User user, AuthChallengeType type);

    record IssuedChallenge(AuthChallenge challenge, String rawToken) {}
}
