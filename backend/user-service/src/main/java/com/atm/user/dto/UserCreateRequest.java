package com.atm.user.dto;

import com.atm.domain.entity.UserRole;
import com.atm.domain.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @Size(max = 32) String phone,
        Long bankId,
        @NotNull UserRole role,
        @NotNull UserStatus status) { }
