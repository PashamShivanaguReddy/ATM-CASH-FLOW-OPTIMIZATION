package com.atm.prediction.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record MLPredictionRequest(String atmId,
								  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd") LocalDate predictionDate,
								  Map<String, BigDecimal> features) {
}
