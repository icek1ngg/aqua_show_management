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
            String password
    ) {
    }

    public record RegisterResponse(
            UUID id,
            String email
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {
    }

    public record LoginResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            UserProfileResponse user
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
            UserStatus status
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

            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^\\d{9,11}$", message = "Phone number must contain 9 to 11 digits only")
            String phoneNumber,

            @Size(max = 255, message = "Address must not exceed 255 characters")
            String address
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
}
