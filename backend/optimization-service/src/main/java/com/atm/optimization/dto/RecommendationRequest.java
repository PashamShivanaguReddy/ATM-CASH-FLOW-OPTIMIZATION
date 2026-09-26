package com.atm.optimization.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RecommendationRequest(
        Long predictionId,
        @DecimalMin("0.0") BigDecimal predictedDemand,
        @DecimalMin("0.0") BigDecimal safetyReserve,
        LocalDate recommendedRefillDate) {
}
