package com.atm.domain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PredictionEvaluationDto(
        Long id,
        Long predictionId,
        Long atmId,
        @NotNull LocalDate predictionDate,
        @NotNull String modelVersion,
        @NotNull @PositiveOrZero BigDecimal actualDemand,
        @NotNull @PositiveOrZero BigDecimal predictedDemand,
        @NotNull @PositiveOrZero BigDecimal absoluteError,
        @PositiveOrZero BigDecimal percentageError,
        @NotNull Instant evaluatedAt
) {}
