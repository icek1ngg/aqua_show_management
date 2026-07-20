package com.asms.core.security;

import com.asms.core.response.ApiResponse;
import com.asms.identity.security.OAuth2AuthenticationSuccessHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final ObjectMapper objectMapper;
    private final CsrfAndOriginValidationFilter csrfAndOriginValidationFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final String frontendBaseUrl;
    private final FrontendOriginPolicy frontendOriginPolicy;

    public SecurityConfig(
            ObjectMapper objectMapper,
            CsrfAndOriginValidationFilter csrfAndOriginValidationFilter,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl,
            FrontendOriginPolicy frontendOriginPolicy
    ) {
        this.objectMapper = objectMapper;
        this.csrfAndOriginValidationFilter = csrfAndOriginValidationFilter;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
        this.frontendBaseUrl = frontendBaseUrl;
        this.frontendOriginPolicy = frontendOriginPolicy;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://lh3.googleusercontent.com"))
                        .referrerPolicy(referrer -> referrer.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .permissionsPolicy(permissions -> permissions.policy("geolocation=(), camera=(), microphone=()"))
                )
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint((request, response, exception) ->
                                writeErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required"))
                        .accessDeniedHandler((request, response, exception) ->
                                writeErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, "Access denied"))
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout", "/api/auth/resend-verification", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/oauth2/complete").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/verify-email", "/api/auth/csrf").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/shows", "/api/shows/**", "/api/schedules/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/callback").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/bookings/*/resend-ticket-email").hasAnyRole("USER", "STAFF", "MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/tickets/validate").hasRole("STAFF")
                        .requestMatchers("/api/manager/**").hasRole("MANAGER")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(new SimpleUrlAuthenticationFailureHandler(oAuth2FailureUrl()))
                )
                .addFilterBefore(csrfAndOriginValidationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(frontendOriginPolicy.allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN", "ngrok-skip-browser-warning"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private void writeErrorResponse(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponse.failure(message));
    }

    private String oAuth2FailureUrl() {
        String baseUrl = frontendBaseUrl == null || frontendBaseUrl.isBlank()
                ? "http://localhost:5173"
                : frontendBaseUrl;
        return UriComponentsBuilder
                .fromUriString(baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl)
                .path("/login")
                .queryParam("oauthError", "true")
                .build()
                .toUriString();
    }
}
