package com.asms.identity.security;

import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.AuthChallengeRepository;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.AuthSessionService;
import com.asms.identity.service.OAuthOnboardingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class OAuth2AuthenticationSuccessHandlerTest {

    private UserRepository userRepository;
    private AuthChallengeRepository authChallengeRepository;
    private JwtService jwtService;
    private AuthSessionService authSessionService;
    private RefreshTokenCookieService refreshTokenCookieService;
    private OAuthOnboardingService oauthOnboardingService;
    private OAuth2AuthenticationSuccessHandler handler;

    private HttpServletRequest request;
    private HttpServletResponse response;
    private Authentication authentication;
    private OAuth2User oauth2User;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        authChallengeRepository = mock(AuthChallengeRepository.class);
        jwtService = mock(JwtService.class);
        authSessionService = mock(AuthSessionService.class);
        refreshTokenCookieService = mock(RefreshTokenCookieService.class);
        oauthOnboardingService = mock(OAuthOnboardingService.class);

        handler = new OAuth2AuthenticationSuccessHandler(
                userRepository,
                authChallengeRepository,
                jwtService,
                authSessionService,
                refreshTokenCookieService,
                oauthOnboardingService,
                "http://localhost:5173"
        );

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        authentication = mock(Authentication.class);
        oauth2User = mock(OAuth2User.class);

        when(authentication.getPrincipal()).thenReturn(oauth2User);
    }

    @Test
    void onAuthenticationSuccess_ThrowsIfEmailNotVerified() {
        when(oauth2User.getAttribute("email_verified")).thenReturn(false);

        assertThrows(OAuth2AuthenticationException.class, () ->
                handler.onAuthenticationSuccess(request, response, authentication)
        );
    }

    @Test
    void onAuthenticationSuccess_RedirectsToConsentForNewUser() throws Exception {
        when(oauth2User.getAttribute("email_verified")).thenReturn(true);
        when(oauth2User.getAttribute("sub")).thenReturn("g123");
        when(oauth2User.getAttribute("email")).thenReturn("new@example.com");

        when(userRepository.findByGoogleId("g123")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(oauthOnboardingService.storeOnboardingCode(any(), any(), any(), any())).thenReturn("code123");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(response).sendRedirect("http://localhost:5173/oauth2/consent?code=code123");
    }
}
