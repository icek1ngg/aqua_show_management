package com.asms.identity.controller;

import com.asms.core.response.ApiResponse;
import com.asms.core.response.PageResponse;
import com.asms.identity.dto.AdminDtos.UpdateUserRequest;
import com.asms.identity.dto.AdminDtos.UserDetailResponse;
import com.asms.identity.dto.AdminDtos.UserManagementResponse;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserRole;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ApiResponse<PageResponse<UserManagementResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success("Users fetched successfully", adminUserService.getUsers(keyword, role, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<UserDetailResponse> getUser(@PathVariable UUID id) {
        return ApiResponse.success("User fetched successfully", adminUserService.getUser(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserDetailResponse> updateUser(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
        return ApiResponse.success("User updated successfully", adminUserService.updateUser(id, request));
    }

    @PatchMapping("/{id}/disable")
    public ApiResponse<Void> disableUser(@PathVariable UUID id, @AuthenticationPrincipal User currentAdmin) {
        adminUserService.disableUser(id, currentAdmin);
        return ApiResponse.success("User disabled successfully");
    }

    @PatchMapping("/{id}/enable")
    public ApiResponse<Void> enableUser(@PathVariable UUID id) {
        adminUserService.enableUser(id);
        return ApiResponse.success("User enabled successfully");
    }
}
