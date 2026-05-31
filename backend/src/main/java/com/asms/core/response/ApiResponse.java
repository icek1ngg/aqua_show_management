package com.asms.core.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Instant timestamp,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Map<String, String> errors
) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data, null, null);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, null, null);
    }

    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(true, message, null, null, null);
    }

    public static ApiResponse<Void> failure(String message) {
        return new ApiResponse<>(false, message, null, null, null);
    }

    public static ApiResponse<Void> failure(String message, Instant timestamp) {
        return new ApiResponse<>(false, message, null, timestamp, null);
    }

    public static ApiResponse<Void> validationFailure(Map<String, String> errors) {
        return new ApiResponse<>(false, "Validation failed", null, null, errors);
    }
}
