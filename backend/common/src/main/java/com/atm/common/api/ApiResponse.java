package com.atm.common.api;

import java.time.Instant;

public record ApiResponse<T>(boolean success, String message, T data, Instant timestamp, String path) {
    public static <T> ApiResponse<T> success(String message, T data, String path) {
        return new ApiResponse<>(true, message, data, Instant.now(), path);
    }
}
