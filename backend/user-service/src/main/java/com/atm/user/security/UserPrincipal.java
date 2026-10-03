package com.atm.user.security;

public record UserPrincipal(String email, Long userId, Long bankId, String role) { }
