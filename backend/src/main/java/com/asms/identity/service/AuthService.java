package com.asms.identity.service;

import com.asms.identity.dto.AuthDtos.LoginRequest;
import com.asms.identity.dto.AuthDtos.AuthSession;
import com.asms.identity.dto.AuthDtos.LoginResponse;
import com.asms.identity.dto.AuthDtos.RegisterRequest;
import com.asms.identity.dto.AuthDtos.RegisterResponse;

public interface AuthService {

    RegisterResponse register(RegisterRequest request);

    AuthSession login(LoginRequest request);

    AuthSession refresh(String refreshToken);

    void logout(String refreshToken);
}
