package com.asms.identity.service;

import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.response.PageResponse;
import com.asms.identity.dto.AdminDtos.UpdateUserRequest;
import com.asms.identity.dto.AdminDtos.UserDetailResponse;
import com.asms.identity.dto.AdminDtos.UserManagementResponse;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserRole;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final AuthSessionService authSessionService;

    public AdminUserService(UserRepository userRepository, AuthSessionService authSessionService) {
        this.userRepository = userRepository;
        this.authSessionService = authSessionService;
    }

    @Transactional(readOnly = true)
    public PageResponse<UserManagementResponse> getUsers(String keyword, UserRole role, UserStatus status, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = sanitizeSize(size);
        List<User> filtered = userRepository.findAll()
                .stream()
                .filter((user) -> role == null || user.getRole() == role)
                .filter((user) -> status == null || user.getStatus() == status)
                .filter((user) -> matchesKeyword(user, keyword))
                .sorted(Comparator.comparing(User::getCreatedAt).reversed())
                .toList();
        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        List<UserManagementResponse> items = filtered.subList(fromIndex, toIndex).stream().map(this::toManagementResponse).toList();
        return PageResponse.from(new PageImpl<>(filtered.subList(fromIndex, toIndex), PageRequest.of(safePage, safeSize), filtered.size()), items);
    }

    @Transactional(readOnly = true)
    public UserDetailResponse getUser(UUID id) {
        return userRepository.findById(id).map(this::toDetailResponse).orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Transactional
    public UserDetailResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName().trim());
        }
        if (request.firstMiddleName() != null && !request.firstMiddleName().isBlank()) {
            user.setFirstMiddleName(request.firstMiddleName().trim());
        }
        if (request.gender() != null) {
            user.setGender(request.gender());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(normalizeNullable(request.phoneNumber()));
        }
        if (request.address() != null) {
            user.setAddress(normalizeNullable(request.address()));
        }
        if (request.dateOfBirth() != null) {
            user.setDateOfBirth(request.dateOfBirth());
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        user.invalidateAuthentication();
        authSessionService.revokeAll(user);
        return toDetailResponse(user);
    }

    @Transactional
    public void disableUser(UUID targetUserId, User currentAdmin) {
        if (currentAdmin.getId().equals(targetUserId)) {
            throw new BadRequestException("Admin cannot disable own account");
        }
        User user = userRepository.findById(targetUserId).orElseThrow(() -> new NotFoundException("User not found"));
        if (user.getRole() == UserRole.ADMIN && userRepository.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE) <= 1) {
            throw new BadRequestException("Cannot disable the last active admin");
        }
        user.setStatus(UserStatus.DISABLED);
        user.invalidateAuthentication();
        authSessionService.revokeAll(user);
    }

    @Transactional
    public void enableUser(UUID targetUserId) {
        User user = userRepository.findById(targetUserId).orElseThrow(() -> new NotFoundException("User not found"));
        user.setStatus(UserStatus.ACTIVE);
    }

    private boolean matchesKeyword(User user, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        String normalized = keyword.trim().toLowerCase();
        return user.getEmail().toLowerCase().contains(normalized)
                || user.getFullName().toLowerCase().contains(normalized)
                || (user.getPhoneNumber() != null && user.getPhoneNumber().contains(normalized));
    }

    private UserManagementResponse toManagementResponse(User user) {
        return new UserManagementResponse(user.getId(), user.getEmail(), user.getFullName(), user.getPhoneNumber(), user.getRole(), user.getStatus(), user.getCreatedAt());
    }

    private UserDetailResponse toDetailResponse(User user) {
        return new UserDetailResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getLastName(),
                user.getFirstMiddleName(),
                user.getGender(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getDateOfBirth(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private int sanitizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }
}
