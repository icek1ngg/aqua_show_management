package com.asms.core.security;

import com.asms.identity.entity.User;
import com.asms.identity.repository.AuthSessionRepository;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthSessionRepository authSessionRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository,
            AuthSessionRepository authSessionRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.authSessionRepository = authSessionRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(7);
        SecurityContextHolder.clearContext();
        // An explicit Bearer token must take precedence over an OAuth/session
        // authentication that may still be present in the browser. Otherwise a
        // stale JSESSIONID can cause a valid MANAGER token to be evaluated with
        // the previous session user's authorities.
        if (jwtService.isValid(token)) {
            java.util.Map<String, Object> claims = jwtService.extractClaims(token);
            String email = claims.get("sub").toString();
            long tokenAuthVersion = claims.get("authVersion") instanceof Number n ? n.longValue() : Long.parseLong(claims.get("authVersion").toString());

            userRepository.findByEmailIgnoreCase(email)
                    .filter(User::isEnabled)
                    .filter(user -> user.getAuthVersion() == tokenAuthVersion)
                    .ifPresent(user -> {
                        UUID sessionId = parseSessionId(claims.get("sid"));
                        if (sessionId == null || !authSessionRepository.existsByIdAndUserAndExpiresAtAfter(
                                sessionId, user, Instant.now())) {
                            return;
                        }

                        com.asms.identity.security.JwtAuthenticationToken authentication = new com.asms.identity.security.JwtAuthenticationToken(
                                user,
                                null,
                                user.getAuthorities(),
                                sessionId
                        );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
        }

        filterChain.doFilter(request, response);
    }

    private UUID parseSessionId(Object sidClaim) {
        if (sidClaim == null) {
            return null;
        }
        try {
            return UUID.fromString(sidClaim.toString());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

}
