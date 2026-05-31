package com.asms.identity.controller;

import com.asms.core.response.ApiResponse;
import com.asms.identity.entity.User;
import com.asms.identity.dto.AuthDtos.UpdateProfileRequest;
import com.asms.identity.dto.AuthDtos.UserProfileResponse;
import com.asms.identity.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/profile")
    public ApiResponse<UserProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        return ApiResponse.success("Profile fetched successfully", userProfileService.getProfile(user));
    }

    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ApiResponse.success("Profile updated successfully", userProfileService.updateProfile(user, request));
    }
}
