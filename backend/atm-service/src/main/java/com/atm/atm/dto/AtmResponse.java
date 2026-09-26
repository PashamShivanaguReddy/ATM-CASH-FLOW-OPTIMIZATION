package com.atm.atm.dto;

import com.atm.domain.entity.AtmStatus;
import com.atm.domain.entity.AtmType;
import java.math.BigDecimal;
import java.time.Instant;

public record AtmResponse(Long id, String atmCode, Long bankId, String location, String city, String state,
                          BigDecimal latitude, BigDecimal longitude, AtmType atmType, AtmStatus status,
                          BigDecimal cashCapacity, BigDecimal minimumCashThreshold, BigDecimal maximumCashThreshold,
                          BigDecimal currentCash, Instant lastRefillAt, Instant createdAt, Instant updatedAt) { }