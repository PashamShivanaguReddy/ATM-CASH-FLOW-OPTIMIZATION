package com.atm.optimization.controller;

import com.atm.domain.dto.OptimizationRecommendationDto;
import com.atm.optimization.dto.RecommendationRequest;
import com.atm.optimization.service.OptimizationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/optimization")
public class OptimizationController {
    private final OptimizationService service;

    public OptimizationController(OptimizationService service) { this.service = service; }

    @PostMapping("/atms/{atmId}/recommend")
    public ResponseEntity<OptimizationRecommendationDto> recommend(
            @PathVariable Long atmId, @Valid @RequestBody RecommendationRequest request) {
        return ResponseEntity.status(201).body(service.recommend(atmId, request));
    }

    @GetMapping("/atms/{atmId}")
    public List<OptimizationRecommendationDto> byAtm(@PathVariable Long atmId) { return service.byAtm(atmId); }

    @GetMapping("/recommendations")
    public List<OptimizationRecommendationDto> list() { return service.list(); }

    @PostMapping("/recommendations/{id}/approve")
    public OptimizationRecommendationDto approve(@PathVariable Long id) { return service.approve(id); }

    @PostMapping("/recommendations/{id}/reject")
    public OptimizationRecommendationDto reject(@PathVariable Long id) { return service.reject(id); }
}
