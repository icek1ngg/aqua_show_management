package com.asms.identity.service;

import com.asms.identity.entity.User;

public interface PasswordResetEmailSender {
    void sendPasswordResetEmail(User user, String tokenString);
    void sendPasswordChangedEmail(User user);
}
