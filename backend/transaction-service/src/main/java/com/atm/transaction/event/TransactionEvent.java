package com.atm.transaction.event;

import com.atm.domain.entity.TransactionType;
import java.math.BigDecimal;
import java.time.Instant;

public record TransactionEvent(String eventType, Long transactionId, Long atmId, TransactionType transactionType,
                               BigDecimal amount, BigDecimal currentCash, Instant occurredAt) { }
