package com.asms.identity.service.impl;

import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.dto.AuthDtos.UpdateProfileRequest;
import com.asms.identity.dto.AuthDtos.UserProfileResponse;
import com.asms.identity.entity.User;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.UserProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;

    public UserProfileServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(User currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication required");
        }

        User user = userRepository.findByEmailIgnoreCase(currentUser.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Authentication required"));
        return toProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(User currentUser, UpdateProfileRequest request) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication required");
        }

        User user = userRepository.findByEmailIgnoreCase(currentUser.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Authentication required"));

        user.setLastName(request.lastName().trim());
        user.setFirstMiddleName(normalizeNullable(request.firstMiddleName()));
        user.setGender(request.gender());
        user.setPhoneNumber(normalizeNullable(request.phoneNumber()));
        user.setAddress(normalizeNullable(request.address()));
        user.setDateOfBirth(request.dateOfBirth());

        return toProfileResponse(user);
    }

    private UserProfileResponse toProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getLastName(),
                user.getFirstMiddleName(),
                user.getGender(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getRole(),
                user.getStatus(),
                user.getAuthProvider(),
                user.getDateOfBirth(),
                user.getCreatedAt()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
