package com.atm.auth.dto;

public record RefreshTokenResponse(String accessToken, String refreshToken, long expiresInSeconds, String tokenType) { }
