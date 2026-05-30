package com.asms.core.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Instant timestamp
) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data, null);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, null);
    }

    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(true, message, null, null);
    }

    public static ApiResponse<Void> failure(String message) {
        return new ApiResponse<>(false, message, null, null);
    }

    public static ApiResponse<Void> failure(String message, Instant timestamp) {
        return new ApiResponse<>(false, message, null, timestamp);
    }
}
