package com.asms.identity.service;

import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.VerificationTokenException;
import com.asms.identity.entity.EmailVerificationToken;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.EmailVerificationTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class VerificationChallengeService {

    private static final int EXPIRY_MINUTES = 30;

    private final EmailVerificationTokenRepository repository;
    private final VerificationTokenCodec codec;

    public VerificationChallengeService(
            EmailVerificationTokenRepository repository,
            VerificationTokenCodec codec
    ) {
        this.repository = repository;
        this.codec = codec;
    }

    @Transactional
    public VerificationTokenCodec.IssuedToken rotate(User user) {
        repository.deleteByUser(user);
        VerificationTokenCodec.IssuedToken issued = codec.issue();
        repository.save(new EmailVerificationToken(user, issued.tokenHash(), EXPIRY_MINUTES));
        return issued;
    }

    @Transactional
    public void verify(String rawToken) {
        EmailVerificationToken token = repository.findByTokenHash(codec.hash(rawToken))
                .orElseThrow(() -> new VerificationTokenException(
                        ErrorCode.VERIFICATION_TOKEN_INVALID,
                        VerificationTokenException.Result.INVALID,
                        "Invalid verification token"
                ));

        if (token.isUsed()) {
            throw new VerificationTokenException(
                    ErrorCode.VERIFICATION_TOKEN_USED,
                    VerificationTokenException.Result.USED,
                    "Verification token has already been used"
            );
        }

        if (token.isExpired()) {
            throw new VerificationTokenException(
                    ErrorCode.VERIFICATION_TOKEN_EXPIRED,
                    VerificationTokenException.Result.EXPIRED,
                    "Verification token has expired"
            );
        }

        token.setUsedAt(LocalDateTime.now());
        token.getUser().setStatus(UserStatus.ACTIVE);
    }
}
