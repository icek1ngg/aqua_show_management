package com.asms.identity.service;

import com.asms.identity.dto.SessionDtos.SessionView;
import com.asms.identity.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserSessionServiceTest {

    @Mock
    private AuthSessionService authSessionService;

    @InjectMocks
    private UserSessionService userSessionService;

    private User testUser;
    private UUID currentSessionId;

    @BeforeEach
    void setUp() {
        testUser = new User("Test", "User", "test@example.com", "1234567890", "hash");
        currentSessionId = UUID.randomUUID();
    }

    @Test
    void list_CallsAuthSessionService() {
        List<SessionView> mockSessions = List.of(
                new SessionView(currentSessionId, Instant.now(), Instant.now(), "Dev", "127.0.0.1", true)
        );
        when(authSessionService.list(testUser, currentSessionId)).thenReturn(mockSessions);

        List<SessionView> result = userSessionService.list(testUser, currentSessionId);

        assertEquals(mockSessions, result);
        verify(authSessionService).list(testUser, currentSessionId);
    }

    @Test
    void revokeSession_CallsAuthSessionService() {
        UUID sessionId = UUID.randomUUID();

        userSessionService.revokeSession(testUser, sessionId);

        verify(authSessionService).revokeSession(testUser, sessionId);
    }

    @Test
    void revokeAllExceptCurrent_CallsAuthSessionService() {
        userSessionService.revokeAllExceptCurrent(testUser, currentSessionId);

        verify(authSessionService).revokeAllExceptCurrent(testUser, currentSessionId);
    }
}
