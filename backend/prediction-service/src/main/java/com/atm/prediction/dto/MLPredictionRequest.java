package com.atm.prediction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record MLPredictionRequest(String atmId, LocalDate predictionDate, Map<String, BigDecimal> features) {
}
