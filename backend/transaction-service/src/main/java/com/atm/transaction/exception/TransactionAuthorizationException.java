package com.atm.transaction.exception;

import org.springframework.security.access.AccessDeniedException;

public class TransactionAuthorizationException extends AccessDeniedException {
    public TransactionAuthorizationException(String message) { super(message); }
}
