package com.asms.identity.service;

import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.VerificationTokenException;
import com.asms.identity.entity.EmailVerificationToken;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.EmailVerificationTokenRepository;
import com.asms.identity.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class VerificationChallengeService {

    private static final int EXPIRY_MINUTES = 30;

    private final EmailVerificationTokenRepository repository;
    private final VerificationTokenCodec codec;
    private final UserRepository userRepository;

    public VerificationChallengeService(
            EmailVerificationTokenRepository repository,
            VerificationTokenCodec codec,
            UserRepository userRepository
    ) {
        this.repository = repository;
        this.codec = codec;
        this.userRepository = userRepository;
    }

    @Transactional
    public VerificationTokenCodec.IssuedToken rotate(User user) {
        UUID userId = Objects.requireNonNull(user.getId(), "Verification challenge user must be persisted");
        User lockedUser = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new IllegalStateException("Verification challenge user no longer exists"));
        if (lockedUser.getStatus() != UserStatus.PENDING_VERIFICATION) {
            throw new IllegalStateException("Verification challenge user is not pending verification");
        }
        return issueForLockedUser(lockedUser);
    }

    @Transactional
    public Optional<PendingChallenge> rotateIfPending(UUID userId) {
        User lockedUser = userRepository.findByIdForUpdate(userId)
                .orElse(null);
        if (lockedUser == null || lockedUser.getStatus() != UserStatus.PENDING_VERIFICATION) {
            return Optional.empty();
        }
        return Optional.of(new PendingChallenge(lockedUser, issueForLockedUser(lockedUser)));
    }

    private VerificationTokenCodec.IssuedToken issueForLockedUser(User lockedUser) {
        repository.deleteByUser(lockedUser);
        repository.flush();
        VerificationTokenCodec.IssuedToken issued = codec.issue();
        repository.save(new EmailVerificationToken(lockedUser, issued.tokenHash(), EXPIRY_MINUTES));
        return issued;
    }

    @Transactional
    public void verify(String rawToken) {
        String tokenHash = codec.hash(rawToken);
        UUID userId = repository.findUserIdByTokenHash(tokenHash)
                .orElseThrow(this::invalidToken);
        User lockedUser = userRepository.findByIdForUpdate(userId)
                .orElseThrow(this::invalidToken);
        EmailVerificationToken token = repository.findByTokenHash(tokenHash)
                .orElseThrow(this::invalidToken);

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
        lockedUser.setStatus(UserStatus.ACTIVE);
    }

    private VerificationTokenException invalidToken() {
        return new VerificationTokenException(
                ErrorCode.VERIFICATION_TOKEN_INVALID,
                VerificationTokenException.Result.INVALID,
                "Invalid verification token"
        );
    }

    public record PendingChallenge(User user, VerificationTokenCodec.IssuedToken token) {
    }
}
