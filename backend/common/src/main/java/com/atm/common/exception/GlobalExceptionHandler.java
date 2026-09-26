package com.atm.common.exception;

import com.atm.common.api.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, exception.getMessage(), exception.getErrorCode(), request);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException exception, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, exception.getMessage(), exception.getErrorCode(), request);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessRuleException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, exception.getMessage(), exception.getErrorCode(), request);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
    public ResponseEntity<ErrorResponse> handleValidation(Exception exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "Validation failed", "VALIDATION_ERROR", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
        return response(HttpStatus.FORBIDDEN, "Forbidden", "FORBIDDEN", request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException exception, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String code = status == HttpStatus.UNAUTHORIZED ? "UNAUTHORIZED" : status.name();
        return response(status, exception.getReason(), code, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", "INTERNAL_ERROR", request);
    }

    private ResponseEntity<ErrorResponse> response(HttpStatus status, String message, String code, HttpServletRequest request) {
        return ResponseEntity.status(status).body(ErrorResponse.of(message, code, request.getRequestURI()));
    }
}
