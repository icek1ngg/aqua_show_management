package com.asms.core.exception;

import org.springframework.http.HttpStatus;

public class AuthRateLimitException extends AppException {

    public AuthRateLimitException(HttpStatus status, ErrorCode code, String message) {
        super(status, code, message);
    }
}
