package com.asms.identity.service;

import com.asms.identity.entity.User;

public interface VerificationEmailSender {

    void send(User user, String rawToken);
}
