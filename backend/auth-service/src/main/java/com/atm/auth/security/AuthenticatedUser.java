package com.atm.auth.security;

public record AuthenticatedUser(String email, Long userId, Long bankId, String role) {
}
