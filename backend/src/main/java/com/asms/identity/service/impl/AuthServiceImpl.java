package com.asms.identity.service.impl;

import com.asms.core.exception.ConflictException;
import com.asms.core.exception.MailSendingException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.dto.AuthDtos.AuthSession;
import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.dto.AuthDtos.LoginResponse;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.dto.AuthDtos.RegisterResponse;
import com.asms.identity.dto.AuthDtos.UserProfileResponse;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.security.JwtService;
import com.asms.identity.service.AuthService;
import com.asms.identity.service.EmailVerificationService;
import com.asms.identity.service.RefreshTokenService;
import com.asms.identity.service.RefreshTokenService.RefreshTokenIssue;
import com.asms.identity.service.RefreshTokenService.RefreshTokenRotation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailVerificationService emailVerificationService;
    private final RefreshTokenService refreshTokenService;

    @Autowired
    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailVerificationService emailVerificationService,
            RefreshTokenService refreshTokenService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailVerificationService = emailVerificationService;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailVerificationService emailVerificationService
    ) {
        this(userRepository, passwordEncoder, jwtService, emailVerificationService, null);
    }

    @Override
    @Transactional(noRollbackFor = MailSendingException.class)
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
        user.setStatus(UserStatus.PENDING_VERIFICATION);

        User savedUser = userRepository.save(user);

        emailVerificationService.sendVerificationEmail(savedUser);

        return new RegisterResponse(savedUser.getId(), savedUser.getEmail());
    }

    @Override
    @Transactional
    public AuthSession login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new UnauthorizedException("Please verify your email before signing in.");
        }

        if (!user.isEnabled()
                || user.getAuthProvider() != AuthProvider.LOCAL
                || user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String accessToken = jwtService.generateToken(user);
        LoginResponse response = new LoginResponse(accessToken, "Bearer", jwtService.getExpirationSeconds(), toProfileResponse(user));

        if (refreshTokenService == null) {
            return new AuthSession(response, "", -1);
        }

        RefreshTokenIssue refreshToken = refreshTokenService.createRefreshToken(user, Boolean.TRUE.equals(request.rememberMe()));
        return new AuthSession(response, refreshToken.token(), refreshToken.cookieMaxAgeSeconds());
    }

    @Override
    @Transactional(readOnly = true)
    public AuthSession refresh(String refreshToken) {
        RefreshTokenRotation rotatedRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken);
        User user = rotatedRefreshToken.user();
        String accessToken = jwtService.generateToken(user);
        LoginResponse response = new LoginResponse(accessToken, "Bearer", jwtService.getExpirationSeconds(), toProfileResponse(user));
        return new AuthSession(response, rotatedRefreshToken.token(), rotatedRefreshToken.cookieMaxAgeSeconds());
    }

    @Override
    public void logout(String refreshToken) {
        if (refreshTokenService != null) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
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
