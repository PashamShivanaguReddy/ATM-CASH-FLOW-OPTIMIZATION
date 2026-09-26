package com.atm.atm.dto;

import com.atm.domain.entity.AtmStatus;
import java.math.BigDecimal;

public record AtmSummaryResponse(Long id, String atmCode, Long bankId, AtmStatus status,
                                 BigDecimal cashCapacity, BigDecimal currentCash, long transactionCount,
                                 boolean refillRequired) { }