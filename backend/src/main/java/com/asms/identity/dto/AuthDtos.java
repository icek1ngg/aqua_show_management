package com.asms.identity.dto;

import com.asms.identity.enums.Gender;
import com.asms.identity.enums.UserRole;
import com.asms.identity.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class AuthDtos {

    public static final String LEGAL_DOCUMENT_VERSION = "2026-07-15";

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Last name is required")
            @Size(min = 1, max = 100, message = "Last name must be 1 to 100 characters")
            @Pattern(regexp = "^[\\p{L} ]+$", message = "Last name must contain letters and spaces only")
            String lastName,

            @NotBlank(message = "First and middle name is required")
            @Size(min = 1, max = 150, message = "First and middle name must be 1 to 150 characters")
            @Pattern(regexp = "^[\\p{L} ]+$", message = "First and middle name must contain letters and spaces only")
            String firstMiddleName,

            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            @Size(max = 150, message = "Email must not exceed 150 characters")
            String email,

            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^\\d{9,11}$", message = "Phone number must contain 9 to 11 digits only")
            String phoneNumber,

            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must be 6 to 100 characters")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Password must include at least one letter and one number")
            String password,

            @jakarta.validation.constraints.AssertTrue(message = "Terms and privacy policy must be accepted")
            boolean acceptedTerms,

            @NotBlank(message = "Legal document version is required")
            @Pattern(regexp = "2026-07-15", message = "Unsupported legal document version")
            String legalDocumentVersion
    ) {
    }

    public record RegisterResponse(
            UUID id,
            String email,
            boolean verificationEmailSent
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            String email,

            @NotBlank(message = "Password is required")
            String password,

            Boolean rememberMe
    ) {
        public LoginRequest(String email, String password) {
            this(email, password, false);
        }
    }

    public record LoginResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            UserProfileResponse user
    ) {
    }

    public record AuthSession(
            LoginResponse response,
            String refreshToken,
            long refreshTokenCookieMaxAgeSeconds
    ) {
    }

    public record UserProfileResponse(
            UUID id,
            String email,
            String fullName,
            String lastName,
            String firstMiddleName,
            Gender gender,
            String phoneNumber,
            String address,
            UserRole role,
            UserStatus status,
            com.asms.identity.enums.AuthProvider authProvider,
            java.time.LocalDate dateOfBirth,
            java.time.Instant createdAt
    ) {
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Last name is required")
            @Size(max = 100, message = "Last name must not exceed 100 characters")
            @Pattern(regexp = "^[\\p{L} ]+$", message = "Last name must contain letters and spaces only")
            String lastName,

            @NotBlank(message = "First and middle name is required")
            @Size(max = 150, message = "First and middle name must not exceed 150 characters")
            @Pattern(regexp = "^[\\p{L} ]+$", message = "First and middle name must contain letters and spaces only")
            String firstMiddleName,

            Gender gender,

            @Pattern(regexp = "^\\s*$|^\\d{9,11}$", message = "Phone number must contain 9 to 11 digits only")
            String phoneNumber,

            @Size(max = 255, message = "Address must not exceed 255 characters")
            String address,

            @jakarta.validation.constraints.Past(message = "Date of birth must be in the past")
            java.time.LocalDate dateOfBirth
    ) {
    }

    public record ResendVerificationRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            String email
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Token is required")
            String token,

            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must be 6 to 100 characters")
            String newPassword,

            @NotBlank(message = "Confirm password is required")
            String confirmPassword
    ) {
    }

    public record OAuthCompleteRequest(
            @NotBlank(message = "Code is required")
            String code,

            @jakarta.validation.constraints.AssertTrue(message = "Terms and privacy policy must be accepted")
            boolean acceptedTerms,

            @NotBlank(message = "Legal document version is required")
            @Pattern(regexp = "2026-07-15", message = "Unsupported legal document version")
            String legalDocumentVersion
    ) {
    }

    public record OAuthCompleteResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            UserProfileResponse user
    ) {
    }
}
