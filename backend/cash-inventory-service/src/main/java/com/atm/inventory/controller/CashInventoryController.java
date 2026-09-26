package com.atm.inventory.controller;

import com.atm.inventory.dto.*;
import com.atm.inventory.service.CashInventoryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class CashInventoryController {
    private final CashInventoryService service;
    public CashInventoryController(CashInventoryService service) { this.service = service; }
    @GetMapping("/api/atms/{atmId}/cash") @PreAuthorize("isAuthenticated()") public CashInventoryResponse getCash(@PathVariable Long atmId, Authentication a) { return service.getInventory(atmId, a); }
    @PutMapping("/api/atms/{atmId}/cash") @PreAuthorize("hasAnyRole('SUPER_ADMIN','BANK_ADMIN','ATM_OPERATOR')") public CashInventoryResponse updateCash(@PathVariable Long atmId, @Valid @RequestBody CashInventoryUpdateRequest r, Authentication a, HttpServletRequest h) { return service.updateInventory(atmId, r, a, h.getRemoteAddr()); }
    @PostMapping("/api/refills") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('SUPER_ADMIN','BANK_ADMIN')") public RefillResponse request(@Valid @RequestBody RefillRequest r, Authentication a, HttpServletRequest h) { return service.requestRefill(r, a, h.getRemoteAddr()); }
    @GetMapping("/api/refills") @PreAuthorize("isAuthenticated()") public List<RefillResponse> list(Authentication a) { return service.listRefills(null, a); }
    @GetMapping("/api/refills/{id}") @PreAuthorize("isAuthenticated()") public RefillResponse get(@PathVariable Long id, Authentication a) { return service.getRefill(id, a); }
    @GetMapping("/api/refills/atm/{atmId}") @PreAuthorize("isAuthenticated()") public List<RefillResponse> byAtm(@PathVariable Long atmId, Authentication a) { return service.listRefills(atmId, a); }
    @PostMapping("/api/refills/{id}/approve") @PreAuthorize("hasAnyRole('SUPER_ADMIN','BANK_MANAGER')") public RefillResponse approve(@PathVariable Long id, Authentication a, HttpServletRequest h) { return service.approve(id, a, h.getRemoteAddr()); }
    @PostMapping("/api/refills/{id}/reject") @PreAuthorize("hasAnyRole('SUPER_ADMIN','BANK_MANAGER')") public RefillResponse reject(@PathVariable Long id, Authentication a, HttpServletRequest h) { return service.reject(id, a, h.getRemoteAddr()); }
    @PostMapping("/api/refills/{id}/complete") @PreAuthorize("hasAnyRole('SUPER_ADMIN','ATM_OPERATOR')") public RefillResponse complete(@PathVariable Long id, Authentication a, HttpServletRequest h) { return service.complete(id, a, h.getRemoteAddr()); }
}
