package com.atm.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record RefillRequest(@NotNull Long atmId, @NotNull @Positive BigDecimal refillAmount, String notes, Long recommendationId) {
    public RefillRequest(Long atmId, BigDecimal refillAmount, String notes) { this(atmId, refillAmount, notes, null); }
}
