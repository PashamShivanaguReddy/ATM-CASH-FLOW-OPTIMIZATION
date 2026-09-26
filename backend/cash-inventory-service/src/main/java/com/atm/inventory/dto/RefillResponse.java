package com.atm.inventory.dto;

import com.atm.domain.entity.RefillStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record RefillResponse(Long id, Long atmId, Long requestedBy, Long approvedBy, BigDecimal refillAmount, Instant refillDate, RefillStatus status, String notes, Instant createdAt, Instant updatedAt) { }
