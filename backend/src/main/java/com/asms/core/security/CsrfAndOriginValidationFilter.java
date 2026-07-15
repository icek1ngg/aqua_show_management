package com.asms.core.security;

import com.asms.core.exception.ErrorCode;
import com.asms.core.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@Component
public class CsrfAndOriginValidationFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private final String frontendBaseUrl;

    // Endpoints that require CSRF token validation
    private static final List<String> CSRF_PROTECTED_PATHS = List.of(
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/auth/oauth2/complete"
    );

    // Endpoints that bypass Origin/CSRF completely (e.g. webhooks)
    private static final List<String> IGNORED_PATHS = List.of(
            "/api/payments/callback"
    );

    public CsrfAndOriginValidationFilter(
            ObjectMapper objectMapper,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl
    ) {
        this.objectMapper = objectMapper;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // 1. Skip ignored paths and non-mutating methods
        if (IGNORED_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String method = request.getMethod();
        if (HttpMethod.GET.name().equals(method) ||
                HttpMethod.HEAD.name().equals(method) ||
                HttpMethod.TRACE.name().equals(method) ||
                HttpMethod.OPTIONS.name().equals(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Validate Origin / Referer (All mutating requests)
        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");
        
        if (!isValidOrigin(origin) && !isValidOrigin(getOriginFromReferer(referer))) {
             reject(response, "Invalid Origin or Referer");
             return;
        }

        // 3. Validate CSRF token (For specific protected paths)
        if (CSRF_PROTECTED_PATHS.contains(path)) {
            String csrfCookieValue = getCookieValue(request, "XSRF-TOKEN");
            String csrfHeaderValue = request.getHeader("X-XSRF-TOKEN");
            if (csrfCookieValue == null || csrfHeaderValue == null || !csrfCookieValue.equals(csrfHeaderValue)) {
                reject(response, "CSRF validation failed");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isValidOrigin(String sourceOrigin) {
        if (sourceOrigin == null) {
            return false;
        }
        // In local development, we allow specific patterns or just match frontendBaseUrl exactly.
        if (sourceOrigin.equals(frontendBaseUrl) || 
            sourceOrigin.equals("http://localhost:5173") || 
            sourceOrigin.equals("http://localhost:5174")) {
            return true;
        }
        return sourceOrigin.endsWith(".ngrok-free.app") || sourceOrigin.endsWith(".ngrok-free.dev");
    }

    private String getOriginFromReferer(String referer) {
        if (referer == null) return null;
        try {
            URI uri = new URI(referer);
            int port = uri.getPort();
            String portStr = (port == -1) ? "" : ":" + port;
            return uri.getScheme() + "://" + uri.getHost() + portStr;
        } catch (URISyntaxException e) {
            return null;
        }
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (name.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), 
            ApiResponse.failure(ErrorCode.CSRF_VALIDATION_FAILED.name(), message));
    }
}
