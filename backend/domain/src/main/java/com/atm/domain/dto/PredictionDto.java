package com.atm.domain.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
public record PredictionDto(Long id, Long atmId, @NotNull LocalDate predictionDate, @NotNull @PositiveOrZero BigDecimal predictedDemand, @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal confidenceScore, @NotBlank String modelVersion, @NotNull Instant generatedAt) { }
