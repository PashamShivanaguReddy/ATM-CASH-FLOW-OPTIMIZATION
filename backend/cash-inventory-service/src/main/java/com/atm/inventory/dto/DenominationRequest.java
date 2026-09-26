package com.atm.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record DenominationRequest(@NotNull @Positive Integer denomination, @NotNull @PositiveOrZero Integer noteCount) { }
