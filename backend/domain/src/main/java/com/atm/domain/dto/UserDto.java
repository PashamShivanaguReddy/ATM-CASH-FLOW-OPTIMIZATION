package com.atm.domain.dto;
import com.atm.domain.entity.*;
import jakarta.validation.constraints.*;
public record UserDto(Long id, Long bankId, @NotBlank String firstName, @NotBlank String lastName, @NotBlank @Email String email, String phone, UserRole role, UserStatus status) { }
