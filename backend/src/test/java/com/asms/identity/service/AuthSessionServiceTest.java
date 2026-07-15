package com.asms.identity.service;

import com.asms.core.exception.UnauthorizedException;
import com.asms.core.exception.ErrorCode;
import com.asms.identity.dto.SessionDtos.ClientContext;
import com.asms.identity.dto.SessionDtos.SessionIssue;
import com.asms.identity.dto.SessionDtos.SessionRotation;
import com.asms.identity.entity.AuthSession;
import com.asms.identity.entity.User;
import com.asms.identity.repository.AuthSessionRepository;
import com.asms.identity.security.RefreshTokenCodec;
import com.asms.identity.service.impl.AuthSessionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthSessionServiceTest {

    @Mock
    private AuthSessionRepository authSessionRepository;

    private RefreshTokenCodec refreshTokenCodec;
    private AuthSessionService authSessionService;

    private User testUser;
    private ClientContext clientContext;

    @BeforeEach
    void setUp() {
        lenient().when(authSessionRepository.saveAndFlush(any(AuthSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        refreshTokenCodec = new RefreshTokenCodec("test-secret-key-for-hmac-sha-256-which-is-long-enough");
        authSessionService = new AuthSessionServiceImpl(
                authSessionRepository,
                refreshTokenCodec,
                86400, // 24 hours
                2592000 // 30 days
        );

        testUser = new User("Doe", "John", "john@example.com", "hash", null);
        testUser.setStatus(com.asms.identity.enums.UserStatus.ACTIVE);
        clientContext = new ClientContext("TestAgent", "127.0.0.1");
    }

    @Test
    void create_shouldSaveHashAndReturnRawToken() {
        SessionIssue issue = authSessionService.create(testUser, false, clientContext);

        assertNotNull(issue);
        assertNotNull(issue.token());
        assertEquals(-1, issue.cookieMaxAgeSeconds()); // short lived is -1

        ArgumentCaptor<AuthSession> sessionCaptor = ArgumentCaptor.forClass(AuthSession.class);
        verify(authSessionRepository).saveAndFlush(any());
        verify(authSessionRepository).save(sessionCaptor.capture());

        AuthSession savedSession = sessionCaptor.getValue();
        assertEquals(testUser, savedSession.getUser());
        assertEquals(1, savedSession.getGeneration());
        assertEquals("TestAgent", savedSession.getDevice());
        assertEquals("127.0.0.1", savedSession.getIpPrefix());

        String expectedHash = refreshTokenCodec.hash(issue.token());
        assertEquals(expectedHash, savedSession.getCurrentTokenHash());
    }

    @Test
    void create_rememberMe_shouldHaveLongLifetime() {
        SessionIssue issue = authSessionService.create(testUser, true, clientContext);
        assertEquals(2592000, issue.cookieMaxAgeSeconds());
    }

    @Test
    void rotate_shouldInvalidatePreviousTokenAndIssueNew() {
        UUID sessionId = UUID.randomUUID();
        String rawToken = refreshTokenCodec.generateToken(sessionId, 1);
        String tokenHash = refreshTokenCodec.hash(rawToken);

        AuthSession session = new AuthSession(testUser, tokenHash, Instant.now().plusSeconds(3600), "Agent", "IP");
        
        when(authSessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        SessionRotation rotation = authSessionService.rotate(rawToken, clientContext);

        assertNotNull(rotation);
        assertNotNull(rotation.token());
        assertNotEquals(rawToken, rotation.token());

        assertEquals(2, session.getGeneration());
        assertEquals(refreshTokenCodec.hash(rotation.token()), session.getCurrentTokenHash());
        verify(authSessionRepository).save(session);
    }

    @Test
    void rotate_withOldGeneration_shouldDetectReuseAndRevokeSession() {
        UUID sessionId = UUID.randomUUID();
        // Generate token with generation 1
        String rawToken = refreshTokenCodec.generateToken(sessionId, 1);
        
        // But session in DB is already at generation 2
        AuthSession session = new AuthSession(testUser, "differentHash", Instant.now().plusSeconds(3600), "Agent", "IP");
        session.setGeneration(2);
        
        when(authSessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        UnauthorizedException exception = assertThrows(
                UnauthorizedException.class,
                () -> authSessionService.rotate(rawToken, clientContext)
        );

        assertEquals(ErrorCode.REFRESH_TOKEN_REUSED, exception.getCode());
        verify(authSessionRepository).delete(session);
    }
    
    @Test
    void rotate_withInvalidSignature_shouldRejectAndNotRevoke() {
        String invalidToken = "invalid.token.format.sig";
        UnauthorizedException exception = assertThrows(
                UnauthorizedException.class,
                () -> authSessionService.rotate(invalidToken, clientContext)
        );
        assertEquals(ErrorCode.REFRESH_TOKEN_INVALID, exception.getCode());
        verifyNoInteractions(authSessionRepository);
    }

    @Test
    void rotate_expiredSession_shouldDeleteSession() {
        UUID sessionId = UUID.randomUUID();
        String rawToken = refreshTokenCodec.generateToken(sessionId, 1);
        
        AuthSession session = new AuthSession(testUser, refreshTokenCodec.hash(rawToken), Instant.now().minusSeconds(10), "Agent", "IP");
        
        when(authSessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        UnauthorizedException exception = assertThrows(
                UnauthorizedException.class,
                () -> authSessionService.rotate(rawToken, clientContext)
        );

        assertEquals(ErrorCode.valueOf("REFRESH_TOKEN_EXPIRED"), exception.getCode());
        verify(authSessionRepository).delete(session);
    }

    @Test
    void rotate_missingSession_shouldReturnStableRevokedCode() {
        UUID sessionId = UUID.randomUUID();
        String rawToken = refreshTokenCodec.generateToken(sessionId, 1);
        when(authSessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.empty());

        UnauthorizedException exception = assertThrows(
                UnauthorizedException.class,
                () -> authSessionService.rotate(rawToken, clientContext)
        );

        assertEquals(ErrorCode.valueOf("AUTH_SESSION_REVOKED"), exception.getCode());
    }
}
