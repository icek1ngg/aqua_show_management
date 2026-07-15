package com.asms.identity.service.impl;

import com.asms.core.exception.BadRequestException;
import com.asms.identity.entity.AuthChallenge;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthChallengeType;
import com.asms.identity.repository.AuthChallengeRepository;
import com.asms.identity.security.AuthTokenCodec;
import com.asms.identity.service.AuthChallengeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class AuthChallengeServiceImpl implements AuthChallengeService {

    private final AuthChallengeRepository challengeRepository;
    private final AuthTokenCodec tokenCodec;

    public AuthChallengeServiceImpl(AuthChallengeRepository challengeRepository, AuthTokenCodec tokenCodec) {
        this.challengeRepository = challengeRepository;
        this.tokenCodec = tokenCodec;
    }

    @Override
    @Transactional
    public IssuedChallenge issue(User user, AuthChallengeType type, Duration lifetime) {
        invalidate(user, type);
        challengeRepository.flush();

        AuthTokenCodec.IssuedToken issuedToken = tokenCodec.issue();
        LocalDateTime expiresAt = LocalDateTime.now().plus(lifetime);

        AuthChallenge challenge = new AuthChallenge(user, type, issuedToken.tokenHash(), expiresAt);
        challenge = challengeRepository.save(challenge);

        return new IssuedChallenge(challenge, issuedToken.rawToken());
    }

    @Override
    @Transactional
    public AuthChallenge consume(String rawToken, AuthChallengeType expectedType) {
        String tokenHash = tokenCodec.hash(rawToken);

        AuthChallenge challenge = challengeRepository.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid challenge token"));

        if (challenge.getType() != expectedType) {
            throw new BadRequestException("Invalid challenge token type");
        }

        if (challenge.isUsed()) {
            throw new BadRequestException("Challenge token has already been used");
        }

        if (challenge.isExpired()) {
            throw new BadRequestException("Challenge token has expired");
        }

        challenge.setUsedAt(LocalDateTime.now());
        return challenge;
    }

    @Override
    @Transactional
    public void invalidate(User user, AuthChallengeType type) {
        challengeRepository.deleteByUserAndType(user, type);
    }
}
