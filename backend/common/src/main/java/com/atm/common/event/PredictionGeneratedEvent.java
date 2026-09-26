package com.atm.common.event;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PredictionGeneratedEvent(Long predictionId, Long atmId, LocalDate predictionDate,
                                      BigDecimal predictedDemand, BigDecimal confidenceScore,
                                      String modelVersion) { }