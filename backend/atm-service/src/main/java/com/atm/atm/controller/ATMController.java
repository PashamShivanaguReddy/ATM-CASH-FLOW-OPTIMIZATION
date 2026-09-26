package com.atm.atm.controller;

import com.atm.atm.dto.*;
import com.atm.atm.service.ATMService;
import com.atm.domain.entity.AtmStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/atms")
public class ATMController {
    private final ATMService service;
    public ATMController(ATMService service) { this.service = service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('SUPER_ADMIN','BANK_ADMIN','BANK_MANAGER','ATM_OPERATOR')") public AtmResponse create(@Valid @RequestBody AtmRequest r, Authentication a, HttpServletRequest h) { return service.create(r, a, h.getRemoteAddr()); }
    @GetMapping @PreAuthorize("isAuthenticated()") public Page<AtmResponse> list(@RequestParam(required=false) Long bankId, @RequestParam(required=false) AtmStatus status, @PageableDefault(sort="createdAt", direction=Sort.Direction.DESC) Pageable p, Authentication a) { return service.list(bankId, status, p, a); }
    @GetMapping("/bank/{bankId}") @PreAuthorize("isAuthenticated()") public Page<AtmResponse> byBank(@PathVariable Long bankId, Pageable p, Authentication a) { return service.list(bankId, null, p, a); }
    @GetMapping("/status/{status}") @PreAuthorize("isAuthenticated()") public Page<AtmResponse> byStatus(@PathVariable AtmStatus status, Pageable p, Authentication a) { return service.list(null, status, p, a); }
    @GetMapping("/{id}") @PreAuthorize("isAuthenticated()") public AtmResponse get(@PathVariable Long id, Authentication a) { return service.get(id, a); }
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','BANK_ADMIN','BANK_MANAGER','ATM_OPERATOR')") public AtmResponse update(@PathVariable Long id, @Valid @RequestBody AtmRequest r, Authentication a, HttpServletRequest h) { return service.update(id, r, a, h.getRemoteAddr()); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('SUPER_ADMIN','BANK_ADMIN','BANK_MANAGER','ATM_OPERATOR')") public void delete(@PathVariable Long id, Authentication a, HttpServletRequest h) { service.delete(id, a, h.getRemoteAddr()); }
    @GetMapping("/{id}/summary") @PreAuthorize("isAuthenticated()") public AtmSummaryResponse summary(@PathVariable Long id, Authentication a) { return service.summary(id, a); }
}