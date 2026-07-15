package com.asms.identity.controller;

import com.asms.identity.dto.SessionDtos.SessionView;
import com.asms.identity.entity.User;
import com.asms.identity.security.JwtAuthenticationToken;
import com.asms.identity.service.UserSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserSessionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserSessionService userSessionService;

    @InjectMocks
    private UserSessionController userSessionController;

    private User testUser;
    private UUID currentSessionId;
    private JwtAuthenticationToken authToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userSessionController).build();

        testUser = new User("Test", "User", "test@example.com", "1234567890", "hash");

        currentSessionId = UUID.randomUUID();
        authToken = new JwtAuthenticationToken(testUser, null, testUser.getAuthorities(), currentSessionId);
    }

    @Test
    void getUserSessions_Success() throws Exception {
        UUID sessionId2 = UUID.randomUUID();
        List<SessionView> mockSessions = List.of(
                new SessionView(currentSessionId, Instant.now().minusSeconds(3600), Instant.now(), "Chrome Windows", "192.168.1.0/24", true, true),
                new SessionView(sessionId2, Instant.now().minusSeconds(7200), Instant.now().minusSeconds(100), "Safari Mac", "10.0.0.0/24", false, false)
        );

        when(userSessionService.list(any(User.class), eq(currentSessionId))).thenReturn(mockSessions);

        mockMvc.perform(get("/api/users/sessions")
                        .principal(authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(currentSessionId.toString()))
                .andExpect(jsonPath("$.data[0].isCurrent").value(true))
                .andExpect(jsonPath("$.data[0].rememberMe").value(true))
                .andExpect(jsonPath("$.data[1].id").value(sessionId2.toString()))
                .andExpect(jsonPath("$.data[1].isCurrent").value(false));

        verify(userSessionService).list(testUser, currentSessionId);
    }

    @Test
    void revokeSession_Success() throws Exception {
        UUID targetSessionId = UUID.randomUUID();

        mockMvc.perform(delete("/api/users/sessions/" + targetSessionId)
                        .principal(authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(userSessionService).revokeSession(testUser, targetSessionId);
    }

    @Test
    void revokeAllExceptCurrent_Success() throws Exception {
        mockMvc.perform(delete("/api/users/sessions")
                        .principal(authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(userSessionService).revokeAllExceptCurrent(testUser, currentSessionId);
    }
}
