package com.asms.core.exception;

import org.springframework.http.HttpStatus;

public class VerificationTokenException extends AppException {

    public enum Result {
        INVALID("invalid"),
        EXPIRED("expired"),
        USED("used");

        private final String queryValue;

        Result(String queryValue) {
            this.queryValue = queryValue;
        }

        public String queryValue() {
            return queryValue;
        }
    }

    private final Result result;

    public VerificationTokenException(ErrorCode code, Result result, String message) {
        super(HttpStatus.BAD_REQUEST, code, message);
        this.result = result;
    }

    public Result getResult() {
        return result;
    }
}
