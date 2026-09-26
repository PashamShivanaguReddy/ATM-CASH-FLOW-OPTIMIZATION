package com.atm.prediction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MLPredictionResponse(String atmId, LocalDate predictionDate, BigDecimal predictedDemand,
                                   BigDecimal confidenceScore, String modelVersion) {
}
