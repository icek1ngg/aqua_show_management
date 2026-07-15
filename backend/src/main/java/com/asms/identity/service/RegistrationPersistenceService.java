package com.asms.identity.service;

import com.asms.core.exception.ConflictException;
import com.asms.core.exception.ErrorCode;
import com.asms.identity.dto.AuthDtos;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class RegistrationPersistenceService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationChallengeService challengeService;

    public RegistrationPersistenceService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            VerificationChallengeService challengeService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.challengeService = challengeService;
    }

    @Transactional
    public PendingRegistration create(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw duplicateEmailConflict();
        }

        User user = new User(
                request.lastName().trim(),
                request.firstMiddleName().trim(),
                email,
                request.phoneNumber().trim(),
                passwordEncoder.encode(request.password())
        );
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        user.recordLegalConsent(AuthDtos.LEGAL_DOCUMENT_VERSION);

        User saved;
        try {
            saved = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw duplicateEmailConflict();
        }

        VerificationTokenCodec.IssuedToken token = challengeService.rotate(saved);
        return new PendingRegistration(saved, token.rawToken());
    }

    private ConflictException duplicateEmailConflict() {
        return new ConflictException(
                ErrorCode.EMAIL_ALREADY_REGISTERED,
                "Email is already registered"
        );
    }

    public record PendingRegistration(User user, String rawToken) {
    }
}
