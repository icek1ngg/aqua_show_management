package com.asms.identity.service;

import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.NotFoundException;
import com.asms.identity.dto.AdminDtos.RoleResponse;
import com.asms.identity.dto.AdminDtos.UserRoleResponse;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserRole;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class AdminRoleService {

    private final UserRepository userRepository;

    public AdminRoleService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<RoleResponse> getRoles() {
        return Arrays.stream(UserRole.values()).map((role) -> new RoleResponse(role, description(role))).toList();
    }

    @Transactional(readOnly = true)
    public UserRoleResponse getUserRole(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        return toResponse(user);
    }

    @Transactional
    public UserRoleResponse assignRole(UUID userId, UserRole role) {
        if (role == null) {
            throw new BadRequestException("Role is required");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        if (user.getRole() == UserRole.ADMIN
                && role != UserRole.ADMIN
                && user.getStatus() == UserStatus.ACTIVE
                && userRepository.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE) <= 1) {
            throw new BadRequestException("Cannot remove the last active admin");
        }
        user.setRole(role);
        return toResponse(user);
    }

    private UserRoleResponse toResponse(User user) {
        return new UserRoleResponse(user.getId(), user.getEmail(), user.getRole(), List.of("ROLE_" + user.getRole().name()));
    }

    private String description(UserRole role) {
        return switch (role) {
            case USER -> "Can book tickets, pay, and view booking history";
            case STAFF -> "Can validate QR tickets and check in guests";
            case MANAGER -> "Can manage shows, schedules, bookings, and reports";
            case ADMIN -> "Can manage users, roles, and administrative access";
        };
    }
}
