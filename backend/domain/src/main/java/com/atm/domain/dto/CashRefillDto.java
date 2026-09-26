package com.atm.domain.dto;
import com.atm.domain.entity.RefillStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
public record CashRefillDto(Long id, Long atmId, Long requestedBy, Long approvedBy, @NotNull @Positive BigDecimal refillAmount, @NotNull Instant refillDate, RefillStatus status, String notes) { }
