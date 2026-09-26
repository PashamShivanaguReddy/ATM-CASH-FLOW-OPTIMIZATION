package com.atm.analytics.controller;

import com.atm.analytics.dto.DashboardDtos.*;
import com.atm.analytics.service.DashboardService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service = service; }

    @GetMapping("/summary")
    public Summary summary(@RequestParam(required = false) Long bankId, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) { return service.summary(bankId, from, to); }

    @GetMapping("/atm-status")
    public PageResponse<AtmStatusItem> atmStatus(@RequestParam(required = false) Long bankId, @RequestParam(required = false) Long atmId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) { return service.atmStatus(bankId, atmId, page, size); }

    @GetMapping("/cash-demand")
    public PageResponse<DemandItem> cashDemand(@RequestParam(required = false) Long bankId, @RequestParam(required = false) Long atmId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) { return service.cashDemand(bankId, atmId, from, to, page, size); }

    @GetMapping("/transactions")
    public PageResponse<TransactionItem> transactions(@RequestParam(required = false) Long bankId, @RequestParam(required = false) Long atmId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) { return service.transactionList(bankId, atmId, from, to, page, size); }

    @GetMapping("/predictions")
    public PageResponse<PredictionItem> predictions(@RequestParam(required = false) Long bankId, @RequestParam(required = false) Long atmId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) { return service.predictionList(bankId, atmId, from, to, page, size); }

    @GetMapping("/alerts")
    public PageResponse<AlertItem> alerts(@RequestParam(required = false) Long bankId, @RequestParam(required = false) Long atmId, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to, @RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) { return service.alertList(bankId, atmId, from, to, status, page, size); }

    @GetMapping("/refills")
    public PageResponse<RefillItem> refills(@RequestParam(required = false) Long bankId, @RequestParam(required = false) Long atmId, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to, @RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) { return service.refillList(bankId, atmId, from, to, status, page, size); }

    @GetMapping("/recommendations")
    public PageResponse<RecommendationItem> recommendations(@RequestParam(required = false) Long bankId, @RequestParam(required = false) Long atmId, @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to, @RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) { return service.recommendationList(bankId, atmId, from, to, status, page, size); }
}
