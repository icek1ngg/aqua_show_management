package com.asms.identity.service;

import com.asms.identity.dto.AuthDtos.UpdateProfileRequest;
import com.asms.identity.dto.AuthDtos.UserProfileResponse;
import com.asms.identity.entity.User;

public interface UserProfileService {

    UserProfileResponse getProfile(User currentUser);

    UserProfileResponse updateProfile(User currentUser, UpdateProfileRequest request);
}
