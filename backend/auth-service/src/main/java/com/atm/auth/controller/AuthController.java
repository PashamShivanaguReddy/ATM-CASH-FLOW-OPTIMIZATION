package com.atm.auth.controller;

import com.atm.auth.dto.*;
import com.atm.auth.service.AuthService;
import com.atm.common.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("User registered", authService.register(request, ip(http)), http.getRequestURI()));
    }
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return ApiResponse.success("Login successful", authService.login(request, ip(http)), http.getRequestURI());
    }
    @PostMapping("/refresh")
    public ApiResponse<RefreshTokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest http) {
        return ApiResponse.success("Token refreshed", authService.refresh(request.refreshToken(), ip(http)), http.getRequestURI());
    }
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest http) {
        authService.logout(request.refreshToken()); return ApiResponse.success("Logged out", null, http.getRequestURI());
    }
    @PutMapping("/users/{userId}/bank")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BANK_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assignBank(@PathVariable Long userId, @Valid @RequestBody AssignBankRequest request,
                           Authentication authentication) {
        authService.assignBank(userId, request.bankId(), authentication);
    }
    private String ip(HttpServletRequest request) { return request.getRemoteAddr(); }
}
