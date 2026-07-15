package com.asms.identity.controller;

import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.core.exception.VerificationTokenException;
import com.asms.core.response.ApiResponse;
import com.asms.identity.dto.AuthDtos.AuthSession;
import com.asms.identity.dto.AuthDtos.ForgotPasswordRequest;
import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.dto.AuthDtos.LoginResponse;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.dto.AuthDtos.RegisterResponse;
import com.asms.identity.dto.AuthDtos.ResendVerificationRequest;
import com.asms.identity.dto.AuthDtos.ResetPasswordRequest;
import com.asms.identity.service.AuthService;
import com.asms.identity.service.EmailVerificationService;
import com.asms.identity.service.PasswordResetService;
import com.asms.identity.security.RefreshTokenCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;
    private final RefreshTokenCookieService refreshTokenCookieService;
    private final String frontendBaseUrl;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService,
            PasswordResetService passwordResetService,
            RefreshTokenCookieService refreshTokenCookieService,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl
    ) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
        this.refreshTokenCookieService = refreshTokenCookieService;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        "Account created. Verify your email before signing in.",
                        authService.register(request, servletRequest.getRemoteAddr())
                )
        );
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthSession authSession = authService.login(request);
        refreshTokenCookieService.addRefreshTokenCookie(
                response,
                authSession.refreshToken(),
                authSession.refreshTokenCookieMaxAgeSeconds()
        );
        return ApiResponse.success("Login successfully", authSession.response());
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @CookieValue(name = RefreshTokenCookieService.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        authService.logout(refreshToken);
        refreshTokenCookieService.clearRefreshTokenCookie(response);
        return ApiResponse.success("Logout successfully");
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(
            @CookieValue(name = RefreshTokenCookieService.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        try {
            AuthSession authSession = authService.refresh(refreshToken);
            refreshTokenCookieService.addRefreshTokenCookie(
                    response,
                    authSession.refreshToken(),
                    authSession.refreshTokenCookieMaxAgeSeconds()
            );
            return ApiResponse.success("Token refreshed successfully", authSession.response());
        } catch (UnauthorizedException exception) {
            refreshTokenCookieService.clearRefreshTokenCookie(response);
            throw exception;
        }
    }

    @PostMapping("/resend-verification")
    public ApiResponse<Void> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        String resultMessage = emailVerificationService.resendVerificationEmail(request.email());
        return ApiResponse.success(resultMessage);
    }

    @GetMapping("/verify-email")
    public void verifyEmail(@RequestParam("token") String token, HttpServletResponse response) throws IOException {
        try {
            emailVerificationService.verifyEmail(token);
            response.sendRedirect(frontendBaseUrl + "/login?verification=success");
        } catch (VerificationTokenException exception) {
            response.sendRedirect(frontendBaseUrl + "/login?verification=" + exception.getResult().queryValue());
        } catch (Exception exception) {
            log.error("Unexpected email verification failure", exception);
            response.sendRedirect(frontendBaseUrl + "/login?verification=invalid");
        }
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.email());
        return ApiResponse.success("If the email exists, a password reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Password confirmation does not match");
        }
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ApiResponse.success("Password has been reset successfully.");
    }
}
