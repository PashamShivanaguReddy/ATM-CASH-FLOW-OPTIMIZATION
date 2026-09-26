package com.atm.auth.dto;

public record LoginResponse(String accessToken, String refreshToken, String tokenType, long expiresInSeconds,
                            Long userId, String email, String role, Long bankId) { }
