package com.asms.core.security;

import com.asms.identity.security.OAuth2AuthenticationSuccessHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class SecurityConfigCorsTest {

    @Test
    void corsUsesTheConfiguredFrontendOriginAndAllowsTheCsrfHeader() {
        SecurityConfig securityConfig = new SecurityConfig(
                mock(ObjectMapper.class),
                mock(CsrfAndOriginValidationFilter.class),
                mock(JwtAuthenticationFilter.class),
                mock(OAuth2AuthenticationSuccessHandler.class),
                "https://app.example.com",
                new FrontendOriginPolicy("https://app.example.com")
        );

        CorsConfiguration configuration = securityConfig.corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest("OPTIONS", "/api/auth/refresh"));

        assertEquals(java.util.List.of("https://app.example.com"), configuration.getAllowedOrigins());
        assertTrue(configuration.getAllowedHeaders().contains("X-XSRF-TOKEN"));
    }
}
