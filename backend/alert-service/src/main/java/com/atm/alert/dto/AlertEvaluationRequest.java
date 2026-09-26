package com.atm.alert.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AlertEvaluationRequest(@NotNull Long atmId, @NotNull BigDecimal predictedDemand) { }