package com.atm.common.event;

import java.math.BigDecimal;

public record RecommendationCreatedEvent(Long recommendationId, Long atmId, Long predictionId,
                                        BigDecimal predictedDemand, BigDecimal recommendedRefillAmount,
                                        Enum<?> status) { }
