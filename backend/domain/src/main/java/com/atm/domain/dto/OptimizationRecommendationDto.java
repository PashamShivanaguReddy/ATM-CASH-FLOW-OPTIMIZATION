package com.atm.domain.dto;
import com.atm.domain.entity.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
public record OptimizationRecommendationDto(Long id, Long atmId, Long predictionId, @NotNull BigDecimal currentCash, @NotNull BigDecimal predictedDemand, @NotNull BigDecimal safetyReserve, @NotNull BigDecimal recommendedRefillAmount, @NotNull LocalDate recommendedRefillDate, RecommendationPriority priority, @NotBlank String reason, RecommendationStatus status, java.time.Instant createdAt, java.time.Instant updatedAt) { }
