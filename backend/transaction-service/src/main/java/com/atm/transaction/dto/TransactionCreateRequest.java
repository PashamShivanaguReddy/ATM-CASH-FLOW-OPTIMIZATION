package com.atm.transaction.dto;

import com.atm.domain.entity.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public record TransactionCreateRequest(
        @NotBlank @Size(max = 64) String transactionId,
        @NotNull Long atmId,
        @NotNull TransactionType transactionType,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        Instant timestamp,
        @NotNull Boolean success,
        @Size(max = 32) String cardType) { }
