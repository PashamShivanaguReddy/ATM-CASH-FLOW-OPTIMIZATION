package com.atm.registry.controller;

import com.atm.common.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/api/v1/status")
    public ApiResponse<String> status() { return ApiResponse.success("Service registry is running", "UP", "/api/v1/status"); }
}