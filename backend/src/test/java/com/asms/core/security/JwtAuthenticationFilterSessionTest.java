package com.asms.core.security;

import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.AuthSessionRepository;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterSessionTest {

    @Mock private JwtService jwtService;
    @Mock private UserRepository userRepository;
    @Mock private AuthSessionRepository authSessionRepository;

    private JwtAuthenticationFilter filter;
    private User user;
    private UUID sessionId;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        filter = new JwtAuthenticationFilter(jwtService, userRepository, authSessionRepository);
        user = new User("Doe", "John", "john@example.com", "hash", null);
        user.setStatus(UserStatus.ACTIVE);
        sessionId = UUID.randomUUID();

        when(jwtService.isValid("token")).thenReturn(true);
        when(jwtService.extractClaims("token")).thenReturn(Map.of(
                "sub", user.getEmail(),
                "authVersion", user.getAuthVersion(),
                "sid", sessionId.toString()
        ));
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void revokedSession_shouldNotAuthenticateAccessToken() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("stale-oauth-session", null, java.util.List.of())
        );

        executeFilter();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void activeSession_shouldAuthenticateAccessToken() throws Exception {
        when(authSessionRepository.existsByIdAndUserAndExpiresAtAfter(
                org.mockito.ArgumentMatchers.eq(sessionId),
                org.mockito.ArgumentMatchers.eq(user),
                org.mockito.ArgumentMatchers.any(Instant.class)))
                .thenReturn(true);

        executeFilter();

        assertEquals(user, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    private void executeFilter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token");
        filter.doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class));
    }
}
