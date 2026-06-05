package com.asms.identity.controller;

import com.asms.core.response.ApiResponse;
import com.asms.identity.dto.AdminDtos.AssignRoleRequest;
import com.asms.identity.dto.AdminDtos.RoleResponse;
import com.asms.identity.dto.AdminDtos.UserRoleResponse;
import com.asms.identity.service.AdminRoleService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoleController {

    private final AdminRoleService adminRoleService;

    public AdminRoleController(AdminRoleService adminRoleService) {
        this.adminRoleService = adminRoleService;
    }

    @GetMapping("/roles")
    public ApiResponse<List<RoleResponse>> getRoles() {
        return ApiResponse.success("Roles fetched successfully", adminRoleService.getRoles());
    }

    @GetMapping("/users/{userId}/role")
    public ApiResponse<UserRoleResponse> getUserRole(@PathVariable UUID userId) {
        return ApiResponse.success("User role fetched successfully", adminRoleService.getUserRole(userId));
    }

    @PatchMapping("/users/{userId}/role")
    public ApiResponse<UserRoleResponse> assignRole(@PathVariable UUID userId, @Valid @RequestBody AssignRoleRequest request) {
        return ApiResponse.success("User role updated successfully", adminRoleService.assignRole(userId, request.role()));
    }

    @PutMapping("/users/{userId}/role")
    public ApiResponse<UserRoleResponse> replaceRole(@PathVariable UUID userId, @Valid @RequestBody AssignRoleRequest request) {
        return assignRole(userId, request);
    }
}
