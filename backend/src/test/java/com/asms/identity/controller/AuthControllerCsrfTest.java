package com.asms.identity.controller;

import com.asms.core.response.ApiResponse;
import com.asms.identity.security.RefreshTokenCookieService;
import com.asms.identity.service.AuthRateLimitService;
import com.asms.identity.service.AuthService;
import com.asms.identity.service.EmailVerificationService;
import com.asms.identity.service.OAuthOnboardingService;
import com.asms.identity.service.PasswordResetService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

class AuthControllerCsrfTest {

    @Test
    void csrfEndpointReturnsTheSameTokenThatItSetsInTheCookie() {
        AuthController controller = new AuthController(
                mock(AuthService.class),
                mock(EmailVerificationService.class),
                mock(PasswordResetService.class),
                mock(RefreshTokenCookieService.class),
                mock(OAuthOnboardingService.class),
                mock(AuthRateLimitService.class),
                "https://app.example.com"
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        ApiResponse<?> result = controller.getCsrfToken(response);

        assertNotNull(result.data());
        assertNotNull(response.getCookie("XSRF-TOKEN"));
        JsonNode data = new ObjectMapper().valueToTree(result.data());
        assertEquals(response.getCookie("XSRF-TOKEN").getValue(), data.get("token").asText());
    }
}
