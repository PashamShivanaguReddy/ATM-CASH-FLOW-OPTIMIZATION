package com.atm.prediction.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Map;

public record PredictionRequest(String atmId, @NotNull LocalDate predictionDate, Map<String, BigDecimal> features) {
}
