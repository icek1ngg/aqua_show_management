package com.asms.identity.service;

import com.asms.core.exception.MailSendingException;
import com.asms.core.exception.ConflictException;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.dto.AuthDtos.RegisterResponse;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.service.RegistrationPersistenceService.PendingRegistration;
import com.asms.identity.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AuthRegistrationServiceTest {

    private final RegisterRequest request = new RegisterRequest(
            "Nguyen", "Van A", "user@example.com", "0909123456",
            "password1", true, "2026-07-15"
    );
    private RegistrationPersistenceService persistence;
    private VerificationEmailSender sender;
    private AuthRateLimitService rateLimitService;
    private AuthServiceImpl service;
    private User user;

    @BeforeEach
    void setUp() {
        persistence = mock(RegistrationPersistenceService.class);
        sender = mock(VerificationEmailSender.class);
        rateLimitService = mock(AuthRateLimitService.class);
        service = new AuthServiceImpl(
                mock(UserRepository.class),
                mock(PasswordEncoder.class),
                mock(JwtService.class),
                mock(RefreshTokenService.class),
                persistence,
                sender,
                rateLimitService
        );
        user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "password-hash");
        user.setStatus(UserStatus.PENDING_VERIFICATION);
    }

    @Test
    void successfulMailReturnsCommittedAccountAndDeliveryStatus() {
        when(persistence.create(request)).thenReturn(new PendingRegistration(user, "raw-token"));

        RegisterResponse response = service.register(request, "127.0.0.1");

        assertThat(response.id()).isEqualTo(user.getId());
        assertThat(response.email()).isEqualTo(user.getEmail());
        assertThat(response.verificationEmailSent()).isTrue();
        verify(persistence).create(request);
        verify(sender).send(user, "raw-token");
    }

    @Test
    void mailFailureStillReturnsTheCommittedAccount() {
        when(persistence.create(request)).thenReturn(new PendingRegistration(user, "raw-token"));
        doThrow(new MailSendingException("smtp down")).when(sender).send(user, "raw-token");

        RegisterResponse response = service.register(request, "127.0.0.1");

        assertThat(response.id()).isEqualTo(user.getId());
        assertThat(response.email()).isEqualTo(user.getEmail());
        assertThat(response.verificationEmailSent()).isFalse();
        verify(persistence).create(request);
        verify(sender).send(user, "raw-token");
    }

    @Test
    void persistenceFailurePropagatesWithoutAttemptingDelivery() {
        ConflictException failure = new ConflictException("duplicate");
        when(persistence.create(request)).thenThrow(failure);

        assertThatThrownBy(() -> service.register(request, "127.0.0.1")).isSameAs(failure);

        verifyNoInteractions(sender);
    }
}
