package com.atm.domain.dto;
import jakarta.validation.constraints.*;
import java.time.Instant;
public record AuditLogDto(Long id, Long userId, @NotBlank String action, @NotBlank String entityType, @NotNull Long entityId, String oldValue, String newValue, @NotNull Instant timestamp, String ipAddress) { }
