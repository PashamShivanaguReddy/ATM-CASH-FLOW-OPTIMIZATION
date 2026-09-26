package com.atm.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

public record TimeAmountResponse(String period, BigDecimal amount, long transactionCount) {
    public static TimeAmountResponse daily(LocalDate date, BigDecimal amount, long count) { return new TimeAmountResponse(date.toString(), amount, count); }
    public static TimeAmountResponse monthly(YearMonth month, BigDecimal amount, long count) { return new TimeAmountResponse(month.toString(), amount, count); }
}
