package com.asms.identity.service;

import com.asms.identity.entity.User;

public interface EmailVerificationService {

    void sendVerificationEmail(User user);

    void verifyEmail(String token);

    String resendVerificationEmail(String email);
}
