package com.atm.prediction.exception;

public class MLServiceException extends RuntimeException {
    private final String errorCode;

    public MLServiceException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}
