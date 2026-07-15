package com.asms.identity.security;

import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.AuthSessionService;
import com.asms.identity.dto.SessionDtos.SessionIssue;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Locale;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthSessionService authSessionService;
    private final RefreshTokenCookieService refreshTokenCookieService;
    private final String frontendBaseUrl;

    @Autowired
    public OAuth2AuthenticationSuccessHandler(
            UserRepository userRepository,
            JwtService jwtService,
            AuthSessionService authSessionService,
            RefreshTokenCookieService refreshTokenCookieService,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.authSessionService = authSessionService;
        this.refreshTokenCookieService = refreshTokenCookieService;
        this.frontendBaseUrl = removeTrailingSlash(frontendBaseUrl);
    }

    public OAuth2AuthenticationSuccessHandler(
            UserRepository userRepository,
            JwtService jwtService,
            String frontendBaseUrl
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.authSessionService = null;
        this.refreshTokenCookieService = null;
        this.frontendBaseUrl = removeTrailingSlash(frontendBaseUrl);
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        User user = findOrCreateGoogleUser(principal);

        String accessToken = jwtService.generateToken(user);
        if (authSessionService != null && refreshTokenCookieService != null) {
            SessionIssue refreshToken = authSessionService.create(
                user, 
                true, 
                new com.asms.identity.dto.SessionDtos.ClientContext(
                    request.getHeader("User-Agent"),
                    request.getRemoteAddr()
                )
            );
            refreshTokenCookieService.addRefreshTokenCookie(response, refreshToken.token(), refreshToken.cookieMaxAgeSeconds());
        }
        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendBaseUrl + "/oauth2/success")
                .queryParam("accessToken", accessToken)
                .queryParam("expiresIn", jwtService.getExpirationSeconds())
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private User findOrCreateGoogleUser(OAuth2User principal) {
        String googleId = requiredAttribute(principal, "sub");
        String email = normalizeEmail(requiredAttribute(principal, "email"));

        return userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmailIgnoreCase(email)
                        .map(existingUser -> linkGoogleAccount(existingUser, googleId))
                        .orElseGet(() -> createGoogleUser(principal, googleId, email)));
    }

    private User linkGoogleAccount(User user, String googleId) {
        user.setGoogleId(googleId);
        if (user.getPasswordHash() == null || user.getAuthProvider() != AuthProvider.LOCAL) {
            user.setAuthProvider(AuthProvider.GOOGLE);
        }
        return userRepository.save(user);
    }

    private User createGoogleUser(OAuth2User principal, String googleId, String email) {
        NameParts nameParts = extractNameParts(principal, email);
        User user = new User(
                nameParts.lastName(),
                nameParts.firstMiddleName(),
                email,
                "",
                null
        );
        user.setGoogleId(googleId);
        user.setAuthProvider(AuthProvider.GOOGLE);
        return userRepository.save(user);
    }

    private NameParts extractNameParts(OAuth2User principal, String email) {
        String familyName = stringAttribute(principal, "family_name");
        String givenName = stringAttribute(principal, "given_name");

        if (!familyName.isBlank()) {
            return new NameParts(familyName, givenName);
        }

        String fullName = stringAttribute(principal, "name");
        if (fullName.isBlank()) {
            fullName = email.substring(0, email.indexOf('@'));
        }

        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 0 || parts[0].isBlank()) {
            return new NameParts("User", "");
        }

        String firstMiddleName = parts.length > 1
                ? fullName.substring(parts[0].length()).trim()
                : "";
        return new NameParts(parts[0], firstMiddleName);
    }

    private String requiredAttribute(OAuth2User principal, String name) {
        String value = stringAttribute(principal, name);
        if (value.isBlank()) {
            throw new IllegalArgumentException("Missing Google OAuth attribute: " + name);
        }
        return value;
    }

    private String stringAttribute(OAuth2User principal, String name) {
        Object value = principal.getAttribute(name);
        return value == null ? "" : value.toString().trim();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String removeTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:5173";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private record NameParts(String lastName, String firstMiddleName) {
    }
}
