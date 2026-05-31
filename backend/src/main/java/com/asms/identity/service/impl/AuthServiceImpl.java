package com.asms.identity.service.impl;

import com.asms.core.exception.ConflictException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.dto.AuthDtos.LoginResponse;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.dto.AuthDtos.RegisterResponse;
import com.asms.identity.dto.AuthDtos.UserProfileResponse;
import com.asms.identity.entity.User;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already registered");
        }

        User user = new User(
                request.lastName().trim(),
                normalizeNullable(request.firstMiddleName()),
                email,
                normalizeNullable(request.phoneNumber()),
                passwordEncoder.encode(request.password())
        );

        User savedUser = userRepository.save(user);
        return new RegisterResponse(savedUser.getId(), savedUser.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String accessToken = jwtService.generateToken(user);
        return new LoginResponse(accessToken, "Bearer", jwtService.getExpirationSeconds(), toProfileResponse(user));
    }

    @Override
    public void logout() {
        // JWT logout is stateless for now. Token revocation can be added when a blacklist store is introduced.
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
                user.getStatus()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim();
    }
}
