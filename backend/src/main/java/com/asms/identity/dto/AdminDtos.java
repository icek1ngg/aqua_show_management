package com.asms.identity.dto;

import com.asms.identity.enums.Gender;
import com.asms.identity.enums.UserRole;
import com.asms.identity.enums.UserStatus;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record UserManagementResponse(
            UUID id,
            String email,
            String fullName,
            String phoneNumber,
            UserRole role,
            UserStatus status,
            Instant createdAt
    ) {
    }

    public record UserDetailResponse(
            UUID id,
            String email,
            String fullName,
            String lastName,
            String firstMiddleName,
            Gender gender,
            String phoneNumber,
            String address,
            LocalDate dateOfBirth,
            UserRole role,
            UserStatus status,
            Instant createdAt
    ) {
    }

    public record UpdateUserRequest(
            @Size(max = 100, message = "Last name must not exceed 100 characters")
            String lastName,
            @Size(max = 150, message = "First and middle name must not exceed 150 characters")
            String firstMiddleName,
            Gender gender,
            @Pattern(regexp = "^\\s*$|^\\d{9,11}$", message = "Phone number must contain 9 to 11 digits only")
            String phoneNumber,
            @Size(max = 255, message = "Address must not exceed 255 characters")
            String address,
            LocalDate dateOfBirth,
            UserStatus status
    ) {
    }

    public record RoleResponse(
            UserRole name,
            String description
    ) {
    }

    public record AssignRoleRequest(
            UserRole role
    ) {
    }

    public record UserRoleResponse(
            UUID userId,
            String email,
            UserRole role,
            List<String> authorities
    ) {
    }
}
