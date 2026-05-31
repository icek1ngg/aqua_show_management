package com.asms.core.exception;

import org.springframework.http.HttpStatus;

public class MailSendingException extends AppException {

    public MailSendingException(String message) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
}
