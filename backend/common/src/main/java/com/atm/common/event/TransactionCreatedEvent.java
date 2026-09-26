package com.atm.common.event;

import java.math.BigDecimal;

public record TransactionCreatedEvent(Long transactionId, Long atmId, String transactionType,
                                     BigDecimal amount, BigDecimal currentCash) { }