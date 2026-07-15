package com.asms.identity.service;

public interface AuthRateLimitService {

    void checkRegistration(String normalizedEmail, String remoteIp);

    void checkResend(String normalizedEmail);
}
