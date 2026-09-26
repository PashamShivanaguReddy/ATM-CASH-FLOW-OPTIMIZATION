package com.atm.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HealthController {
    @GetMapping("/api/v1/status")
    public Map<String, String> status() { return Map.of("message", "API gateway is running", "status", "UP"); }
}