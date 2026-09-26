package com.atm.alert.controller;

import com.atm.alert.dto.AlertEvaluationRequest;
import com.atm.alert.service.AlertService;
import com.atm.domain.dto.AlertDto;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {
    private final AlertService service;
    public AlertController(AlertService service) { this.service = service; }

    @GetMapping
    public List<AlertDto> list(@RequestParam(required = false) Long atmId, @RequestParam(required = false) String status) { return service.list(atmId, status); }
    @GetMapping("/{id}")
    public AlertDto get(@PathVariable Long id) { return service.get(id); }
    @GetMapping("/atm/{atmId}")
    public List<AlertDto> byAtm(@PathVariable Long atmId) { return service.list(atmId, null); }
    @GetMapping("/status/{status}")
    public List<AlertDto> byStatus(@PathVariable String status) { return service.list(null, status); }
    @PostMapping("/{id}/acknowledge")
    public AlertDto acknowledge(@PathVariable Long id) { return service.acknowledge(id); }
    @PostMapping("/{id}/resolve")
    public AlertDto resolve(@PathVariable Long id) { return service.resolve(id); }
    @PostMapping("/internal/evaluate")
    public ResponseEntity<List<AlertDto>> evaluate(@Valid @RequestBody AlertEvaluationRequest request) { return ResponseEntity.status(201).body(service.evaluate(request)); }
}