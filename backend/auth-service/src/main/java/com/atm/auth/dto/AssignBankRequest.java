package com.atm.auth.dto;

import jakarta.validation.constraints.NotNull;

public record AssignBankRequest(@NotNull Long bankId) {
}
