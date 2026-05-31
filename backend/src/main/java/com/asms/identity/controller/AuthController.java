package com.asms.identity.controller;

import com.asms.core.response.ApiResponse;
import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.dto.AuthDtos.LoginResponse;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.dto.AuthDtos.RegisterResponse;
import com.asms.identity.dto.AuthDtos.ResendVerificationRequest;
import com.asms.identity.service.AuthService;
import com.asms.identity.service.EmailVerificationService;
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
    private final String frontendBaseUrl;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService,
            @Value("${asms.frontend.base-url}") String frontendBaseUrl
    ) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
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
    public void verifyEmail(@RequestParam String token, HttpServletResponse response) throws IOException {
        try {
            emailVerificationService.verifyEmail(token);
            response.sendRedirect(frontendBaseUrl + "/login?verified=true");
        } catch (Exception e) {
            response.sendRedirect(frontendBaseUrl + "/login?verified=false");
        }
    }
}
