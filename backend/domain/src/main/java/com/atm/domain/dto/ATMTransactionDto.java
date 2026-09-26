package com.atm.domain.dto;
import com.atm.domain.entity.TransactionType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
public record ATMTransactionDto(Long id, Long atmId, @NotBlank String transactionId, TransactionType transactionType, @NotNull @PositiveOrZero BigDecimal amount, @NotNull Instant timestamp, @NotNull Boolean success, String cardType) { }
