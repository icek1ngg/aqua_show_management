package com.asms.identity.service;

import com.asms.core.exception.AuthRateLimitException;
import com.asms.core.exception.ErrorCode;
import com.asms.identity.dto.AuthDtos.AuthSession;
import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.dto.AuthDtos.LoginResponse;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.dto.AuthDtos.RegisterResponse;
import org.springframework.http.HttpStatus;

public interface AuthService {

    RegisterResponse register(RegisterRequest request, String remoteIp);

    @Deprecated(forRemoval = false)
    default RegisterResponse register(RegisterRequest request) {
        throw new AuthRateLimitException(
                HttpStatus.SERVICE_UNAVAILABLE,
                ErrorCode.RATE_LIMIT_SERVICE_UNAVAILABLE,
                "Authentication rate limit service is temporarily unavailable."
        );
    }

    AuthSession login(LoginRequest request);

    AuthSession refresh(String refreshToken);

    void logout(String refreshToken);
}
