package com.atm.prediction.controller;

import com.atm.domain.dto.PredictionDto;
import com.atm.prediction.dto.PredictionRequest;
import com.atm.prediction.service.PredictionService;
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
@RequestMapping("/api/predictions")
public class PredictionController {
    private final PredictionService service;

    public PredictionController(PredictionService service) { this.service = service; }

    @PostMapping("/{atmId}")
    public ResponseEntity<PredictionDto> create(@PathVariable Long atmId, @Valid @RequestBody PredictionRequest request) {
        return ResponseEntity.status(201).body(service.create(atmId, request));
    }

    @GetMapping("/{atmId}")
    public List<PredictionDto> list(@PathVariable Long atmId) { return service.list(atmId); }

    @GetMapping("/{atmId}/latest")
    public PredictionDto latest(@PathVariable Long atmId) { return service.latest(atmId); }

    @GetMapping("/{atmId}/forecast")
    public List<PredictionDto> forecast(@PathVariable Long atmId) { return service.forecast(atmId); }
}
