package com.asms.identity.service;

import com.asms.identity.dto.AuthDtos;
import com.asms.identity.dto.SessionDtos.ClientContext;
import com.asms.identity.dto.SessionDtos.SessionIssue;
import com.asms.identity.entity.User;
import com.asms.identity.repository.AuthSessionRepository;
import com.asms.identity.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth-refresh;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "spring.rabbitmq.listener.direct.auto-startup=false"
})
class AuthRefreshTransactionIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private AuthSessionService authSessionService;

    @Autowired
    private AuthSessionRepository authSessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @MockBean
    private AuthRateLimitService authRateLimitService;

    @Test
    void refreshPersistsRotationSoTheReturnedTokenCanRotateAgain() {
        User user = userRepository.save(new User(
                "Refresh",
                "Integration",
                "refresh-" + UUID.randomUUID() + "@example.com",
                "0123456789",
                "password-hash"
        ));
        ClientContext context = new ClientContext("Integration Test", "127.0.0.1");
        SessionIssue initialSession = authSessionService.create(user, false, context);

        AuthDtos.AuthSession firstRotation = authService.refresh(initialSession.token(), context);
        entityManager.clear();

        assertEquals(
                2,
                authSessionRepository.findById(UUID.fromString(initialSession.sid())).orElseThrow().getGeneration()
        );
        assertDoesNotThrow(() -> authService.refresh(firstRotation.refreshToken(), context));
    }
}
