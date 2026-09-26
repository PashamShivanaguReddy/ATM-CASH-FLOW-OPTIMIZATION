package com.atm.domain.dto;
import com.atm.domain.entity.BankStatus;
import jakarta.validation.constraints.*;
public record BankDto(Long id, @NotBlank @Size(max=32) String bankCode, @NotBlank @Size(max=160) String name, @Email String email, String phone, String address, BankStatus status) { }
