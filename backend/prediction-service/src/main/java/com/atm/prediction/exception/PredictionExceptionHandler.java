package com.atm.prediction.exception;

import com.atm.common.api.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.core.annotation.Order;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PredictionExceptionHandler {
    @ExceptionHandler(MLServiceException.class)
    public ResponseEntity<ErrorResponse> mlFailure(MLServiceException exception, HttpServletRequest request) {
        return response(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage(), exception.getErrorCode(), request);
    }

    @ExceptionHandler(InvalidPredictionException.class)
    public ResponseEntity<ErrorResponse> invalidPrediction(InvalidPredictionException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_GATEWAY, exception.getMessage(), "INVALID_PREDICTION_RESPONSE", request);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> databaseFailure(DataAccessException exception, HttpServletRequest request) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "Prediction data could not be loaded", "DATABASE_ERROR", request);
    }

    private ResponseEntity<ErrorResponse> response(HttpStatus status, String message, String code, HttpServletRequest request) {
        return ResponseEntity.status(status).body(ErrorResponse.of(message, code, request.getRequestURI()));
    }
}
