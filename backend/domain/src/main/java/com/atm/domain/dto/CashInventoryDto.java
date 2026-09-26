package com.atm.domain.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record CashInventoryDto(Long id, Long atmId, @NotNull @Positive Integer denomination, @NotNull @PositiveOrZero Integer noteCount, @NotNull @PositiveOrZero BigDecimal totalAmount) { }
