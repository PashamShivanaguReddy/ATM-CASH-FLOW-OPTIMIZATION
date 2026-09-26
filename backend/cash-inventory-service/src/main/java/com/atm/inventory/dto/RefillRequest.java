package com.atm.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record RefillRequest(@NotNull Long atmId, @NotNull @Positive BigDecimal refillAmount, String notes) { }
