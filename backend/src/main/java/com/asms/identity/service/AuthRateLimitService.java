package com.asms.identity.service;

public interface AuthRateLimitService {

    void checkRegistration(String normalizedEmail, String remoteIp);

    void checkResend(String normalizedEmail);

    void checkLoginFailure(String normalizedEmail, String remoteIp);

    void clearLoginFailure(String normalizedEmail, String remoteIp);

    boolean checkForgot(String normalizedEmail, String remoteIp);

    void checkReset(String remoteIp);

    void checkRefresh(String remoteIp);
}
