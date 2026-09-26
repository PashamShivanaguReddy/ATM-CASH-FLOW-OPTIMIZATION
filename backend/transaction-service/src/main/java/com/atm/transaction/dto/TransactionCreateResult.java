package com.atm.transaction.dto;

public record TransactionCreateResult(TransactionResponse transaction, boolean created) { }
