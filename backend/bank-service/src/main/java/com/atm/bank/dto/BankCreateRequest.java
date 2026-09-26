package com.atm.bank.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BankCreateRequest(
        @NotBlank @Size(max = 32) String bankCode,
        @NotBlank @Size(max = 160) String name,
        @Email @Size(max = 254) String email,
        @Size(max = 32) String phone,
        @Size(max = 500) String address) {
}
