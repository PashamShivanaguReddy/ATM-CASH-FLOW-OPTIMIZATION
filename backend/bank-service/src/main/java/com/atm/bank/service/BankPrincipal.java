package com.atm.bank.service;

public record BankPrincipal(String email, Long userId, Long bankId, String role) {
}
