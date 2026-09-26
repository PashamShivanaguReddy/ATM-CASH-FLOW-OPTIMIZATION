package com.atm.atm.exception;

import org.springframework.security.access.AccessDeniedException;

public class AtmAuthorizationException extends AccessDeniedException {
    public AtmAuthorizationException(String message) { super(message); }
}