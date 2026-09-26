package com.atm.transaction.controller;

import com.atm.domain.entity.TransactionType;
import com.atm.transaction.dto.*;
import com.atm.transaction.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService service;
    public TransactionController(TransactionService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@Valid @RequestBody TransactionCreateRequest request, Authentication authentication, HttpServletRequest httpRequest) {
        TransactionCreateResult result = service.create(request, authentication, httpRequest.getRemoteAddr());
        return result.created() ? ResponseEntity.status(201).body(result.transaction()) : ResponseEntity.ok(result.transaction());
    }

    @GetMapping
    public Page<TransactionResponse> list(@RequestParam(required = false) Long atmId, @RequestParam(required = false) Instant from,
                                          @RequestParam(required = false) Instant to, @RequestParam(required = false) TransactionType type,
                                          @RequestParam(required = false) Boolean status, @PageableDefault(sort = "timestamp") Pageable pageable,
                                          Authentication authentication) {
        return service.search(atmId, from, to, type, status, pageable, authentication);
    }

    @GetMapping("/date-range")
    public Page<TransactionResponse> dateRange(@RequestParam Instant from, @RequestParam Instant to,
                                               @RequestParam(required = false) TransactionType type, @RequestParam(required = false) Boolean status,
                                               @PageableDefault(sort = "timestamp") Pageable pageable, Authentication authentication) {
        return service.search(null, from, to, type, status, pageable, authentication);
    }

    @GetMapping("/{id}")
    public TransactionResponse get(@PathVariable Long id, Authentication authentication) { return service.get(id, authentication); }

    @GetMapping("/transaction/{transactionId}")
    public TransactionResponse getByTransactionId(@PathVariable String transactionId, Authentication authentication) { return service.getByTransactionId(transactionId, authentication); }

    @GetMapping("/atm/{atmId}")
    public Page<TransactionResponse> byAtm(@PathVariable Long atmId, @RequestParam(required = false) Instant from, @RequestParam(required = false) Instant to,
                                           @RequestParam(required = false) TransactionType type, @RequestParam(required = false) Boolean status,
                                           @PageableDefault(sort = "timestamp") Pageable pageable, Authentication authentication) {
        return service.search(atmId, from, to, type, status, pageable, authentication);
    }

    @GetMapping("/atm/{atmId}/daily-summary")
    public List<TimeAmountResponse> daily(@PathVariable Long atmId, @RequestParam(required = false) Instant from, @RequestParam(required = false) Instant to, Authentication authentication) { return service.dailySummary(atmId, start(from), end(to), authentication); }

    @GetMapping("/atm/{atmId}/hourly-summary")
    public List<TimeAmountResponse> hourly(@PathVariable Long atmId, @RequestParam(required = false) Instant from, @RequestParam(required = false) Instant to, Authentication authentication) { return service.hourlySummary(atmId, start(from), end(to), authentication); }

    @GetMapping("/atm/{atmId}/monthly-summary")
    public List<TimeAmountResponse> monthly(@PathVariable Long atmId, @RequestParam(required = false) Instant from, @RequestParam(required = false) Instant to, Authentication authentication) { return service.monthlySummary(atmId, start(from), end(to), authentication); }

    @GetMapping("/atm/{atmId}/summary")
    public TransactionSummaryResponse summary(@PathVariable Long atmId, @RequestParam(required = false) Instant from, @RequestParam(required = false) Instant to, Authentication authentication) { return service.summary(atmId, start(from), end(to), authentication); }

    private Instant start(Instant value) { return value == null ? Instant.now().minus(365, ChronoUnit.DAYS) : value; }
    private Instant end(Instant value) { return value == null ? Instant.now() : value; }
}
