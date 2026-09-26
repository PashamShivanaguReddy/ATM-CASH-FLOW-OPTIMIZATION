package com.atm.transaction.dto;

import com.atm.domain.entity.TransactionType;
import java.math.BigDecimal;
import java.time.Instant;

public record TransactionResponse(Long id, String transactionId, Long atmId, TransactionType transactionType,
                                  BigDecimal amount, Instant timestamp, Boolean success, String cardType,
                                  Instant createdAt) { }
