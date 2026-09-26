package com.atm.domain.dto;
import com.atm.domain.entity.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
public record AlertDto(Long id, Long atmId, AlertType alertType, Severity severity, @NotBlank String message, @NotBlank String status, Instant createdAt, Instant resolvedAt) { }
