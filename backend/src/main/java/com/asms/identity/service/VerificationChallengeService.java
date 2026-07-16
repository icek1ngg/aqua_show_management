package com.asms.identity.service;

import com.asms.core.exception.ErrorCode;
import com.asms.core.exception.VerificationTokenException;
import com.asms.identity.enums.AuthChallengeType;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
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

    private final AuthChallengeService challengeService;
    private final UserRepository userRepository;

    public VerificationChallengeService(
            AuthChallengeService challengeService,
            UserRepository userRepository
    ) {
        this.challengeService = challengeService;
        this.userRepository = userRepository;
    }

    @Transactional
    public String rotate(User user) {
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

    private String issueForLockedUser(User lockedUser) {
        AuthChallengeService.IssuedChallenge issued = challengeService.issue(
                lockedUser,
                AuthChallengeType.EMAIL_VERIFICATION,
                java.time.Duration.ofMinutes(EXPIRY_MINUTES)
        );
        return issued.rawToken();
    }

    @Transactional
    public void verify(String rawToken) {
        com.asms.identity.entity.AuthChallenge challenge;
        try {
            challenge = challengeService.consume(rawToken, AuthChallengeType.EMAIL_VERIFICATION);
        } catch (com.asms.core.exception.BadRequestException e) {
            if (e.getCode() == ErrorCode.VERIFICATION_TOKEN_USED) {
                throw new VerificationTokenException(
                        ErrorCode.VERIFICATION_TOKEN_USED,
                        VerificationTokenException.Result.USED,
                        "Verification token has already been used"
                );
            }
            if (e.getCode() == ErrorCode.VERIFICATION_TOKEN_EXPIRED) {
                throw new VerificationTokenException(
                        ErrorCode.VERIFICATION_TOKEN_EXPIRED,
                        VerificationTokenException.Result.EXPIRED,
                        "Verification token has expired"
                );
            }
            throw invalidToken();
        }

        User lockedUser = challenge.getUser();
        lockedUser.setStatus(UserStatus.ACTIVE);
    }

    private VerificationTokenException invalidToken() {
        return new VerificationTokenException(
                ErrorCode.VERIFICATION_TOKEN_INVALID,
                VerificationTokenException.Result.INVALID,
                "Invalid verification token"
        );
    }

    public record PendingChallenge(User user, String rawToken) {
    }
}
