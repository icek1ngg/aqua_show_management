package com.asms.identity.service;

import com.asms.core.exception.ConflictException;
import com.asms.core.exception.ErrorCode;
import com.asms.identity.dto.AuthDtos;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.entity.EmailVerificationToken;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.EmailVerificationTokenRepository;
import com.asms.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DataJpaTest
@Import({
        RegistrationPersistenceService.class,
        RegistrationDuplicateEmailProbe.class,
        VerificationChallengeService.class,
        VerificationTokenCodec.class,
        BCryptPasswordEncoder.class
})
class RegistrationPersistenceServiceTest {

    @Autowired
    private RegistrationPersistenceService service;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Test
    void createPersistsPendingUserAndHashedChallengeAtomically() {
        RegisterRequest request = request("  USER@Example.COM  ");

        RegistrationPersistenceService.PendingRegistration pending = service.create(request);

        assertThat(userRepository.count()).isOne();
        User saved = userRepository.findById(pending.user().getId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(UserStatus.PENDING_VERIFICATION);
        assertThat(saved.getEmail()).isEqualTo("user@example.com");
        assertThat(passwordEncoder.matches(request.password(), saved.getPasswordHash())).isTrue();
        assertThat(saved.getPasswordHash()).startsWith("$2");
        assertThat(saved.getTermsAcceptedAt()).isNotNull();
        assertThat(saved.getLegalDocumentVersion()).isEqualTo(AuthDtos.LEGAL_DOCUMENT_VERSION);

        assertThat(tokenRepository.count()).isOne();
        EmailVerificationToken token = tokenRepository.findAll().getFirst();
        assertThat(token.getTokenHash()).hasSize(64).isNotEqualTo(pending.rawToken());
        assertThat(new VerificationTokenCodec().hash(pending.rawToken())).isEqualTo(token.getTokenHash());
    }

    @Test
    void concurrentDuplicateInsertMapsToCodedEmailConflict() {
        UserRepository repository = mock(UserRepository.class);
        when(repository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("users_email_key"));
        RegistrationPersistenceService concurrentService = new RegistrationPersistenceService(
                repository,
                passwordEncoder,
                mock(VerificationChallengeService.class),
                duplicateEmailProbe(true)
        );

        assertThatThrownBy(() -> concurrentService.create(request("user@example.com")))
                .isInstanceOfSatisfying(ConflictException.class,
                        exception -> assertThat(exception.getCode())
                                .isEqualTo(ErrorCode.EMAIL_ALREADY_REGISTERED));
    }

    private RegistrationDuplicateEmailProbe duplicateEmailProbe(boolean exists) {
        RegistrationDuplicateEmailProbe probe = mock(RegistrationDuplicateEmailProbe.class);
        when(probe.existsInNewTransaction("user@example.com")).thenReturn(exists);
        return probe;
    }

    private RegisterRequest request(String email) {
        return new RegisterRequest(
                "  Nguyen  ", "  Van A  ", email, "  0909123456  ",
                "password1", true, AuthDtos.LEGAL_DOCUMENT_VERSION
        );
    }
}
