package com.asms.identity.controller;

import com.asms.core.exception.BadRequestException;
import com.asms.core.response.ApiResponse;
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
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
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

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;
    private final String frontendBaseUrl;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService,
            PasswordResetService passwordResetService,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl
    ) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @PostMapping("/register")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Register successfully", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login successfully", authService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        authService.logout();
        return ApiResponse.success("Logout successfully");
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
            response.sendRedirect(frontendBaseUrl + "/login?verified=true");
        } catch (Exception e) {
            response.sendRedirect(frontendBaseUrl + "/login?verified=false");
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
