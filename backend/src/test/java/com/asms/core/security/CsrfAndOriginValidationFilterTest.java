package com.asms.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class CsrfAndOriginValidationFilterTest {

    @Test
    void rejectsUnconfiguredNgrokOrigin() throws Exception {
        CsrfAndOriginValidationFilter filter = new CsrfAndOriginValidationFilter(
                new ObjectMapper(),
                new FrontendOriginPolicy("https://app.example.com")
        );
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader("Origin", "https://attacker.ngrok-free.app");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus());
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void acceptsOnlyTheConfiguredFrontendOrigin() throws Exception {
        CsrfAndOriginValidationFilter filter = new CsrfAndOriginValidationFilter(
                new ObjectMapper(),
                new FrontendOriginPolicy("https://app.example.com")
        );
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader("Origin", "https://app.example.com");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}
