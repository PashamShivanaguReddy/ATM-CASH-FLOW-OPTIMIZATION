package com.atm.auth.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/authorization")
public class AuthorizationController {
    @GetMapping("/administration-check")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BANK_ADMIN')")
    public String administrationCheck() { return "authorized"; }
}
