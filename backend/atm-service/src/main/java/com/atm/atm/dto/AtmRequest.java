package com.atm.atm.dto;

import com.atm.domain.entity.AtmStatus;
import com.atm.domain.entity.AtmType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record AtmRequest(
        @NotBlank @Size(max = 32) String atmCode,
        @NotNull Long bankId,
        @NotBlank @Size(max = 500) String location,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String state,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
        @NotNull AtmType atmType,
        AtmStatus status,
        @NotNull @Positive BigDecimal cashCapacity,
        @NotNull @PositiveOrZero BigDecimal minimumCashThreshold,
        @NotNull @PositiveOrZero BigDecimal maximumCashThreshold,
        @NotNull @PositiveOrZero BigDecimal currentCash) { }