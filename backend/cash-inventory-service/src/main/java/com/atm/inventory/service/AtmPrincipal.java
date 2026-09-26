package com.atm.inventory.service;

public record AtmPrincipal(String email, Long userId, Long bankId, String role) { }
