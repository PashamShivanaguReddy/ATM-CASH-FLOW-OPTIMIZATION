package com.atm.bank.controller;

import com.atm.bank.dto.BankCreateRequest;
import com.atm.bank.service.BankService;
import com.atm.domain.dto.BankDto;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/banks")
public class BankController {
    private final BankService service;

    public BankController(BankService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public BankDto create(@Valid @RequestBody BankCreateRequest request, Authentication authentication) {
        return service.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Page<BankDto> list(Pageable pageable, Authentication authentication) {
        return service.list(pageable, authentication);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public BankDto get(@PathVariable Long id, Authentication authentication) {
        return service.get(id, authentication);
    }
}
