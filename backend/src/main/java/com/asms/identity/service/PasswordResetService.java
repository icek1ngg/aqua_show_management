package com.asms.identity.service;

public interface PasswordResetService {

    void requestPasswordReset(String email);

    void resetPassword(String token, String newPassword);
}
