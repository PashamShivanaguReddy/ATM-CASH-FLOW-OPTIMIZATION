package com.atm.auth.dto;

import com.atm.domain.entity.UserRole;
import jakarta.validation.constraints.*;

public record RegisterRequest(@NotBlank @Size(max = 100) String firstName, @NotBlank @Size(max = 100) String lastName,
                              @NotBlank @Email String email, @NotBlank @Size(min = 8, max = 72) String password,
                              Long bankId, UserRole role) { }
