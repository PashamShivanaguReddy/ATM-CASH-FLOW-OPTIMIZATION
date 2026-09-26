package com.atm.domain.dto;
import com.atm.domain.entity.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
public record ATMDto(Long id, Long bankId, @NotBlank String atmCode, @NotBlank String location, @NotBlank String city, @NotBlank String state, BigDecimal latitude, BigDecimal longitude, AtmType atmType, AtmStatus status, @NotNull BigDecimal cashCapacity, @NotNull BigDecimal minimumCashThreshold, @NotNull BigDecimal maximumCashThreshold, @NotNull BigDecimal currentCash, Instant lastRefillAt) { }
