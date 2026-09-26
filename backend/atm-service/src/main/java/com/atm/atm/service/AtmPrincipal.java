package com.atm.atm.service;

public record AtmPrincipal(String email, Long userId, Long bankId, String role) { }