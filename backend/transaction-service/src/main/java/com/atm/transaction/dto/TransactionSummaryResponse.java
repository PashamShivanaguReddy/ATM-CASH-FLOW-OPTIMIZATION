package com.atm.transaction.dto;

import java.math.BigDecimal;

public record TransactionSummaryResponse(long numberOfTransactions, BigDecimal totalWithdrawals,
                                         BigDecimal totalDeposits, BigDecimal averageWithdrawal,
                                         BigDecimal maximumWithdrawal, Integer peakTransactionHour) { }
