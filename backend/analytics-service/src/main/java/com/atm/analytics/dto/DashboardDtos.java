package com.atm.analytics.dto;

import com.atm.domain.entity.AtmStatus;
import com.atm.domain.entity.Severity;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class DashboardDtos {
    private DashboardDtos() { }

    public record Summary(long totalAtms, long activeAtms, long lowCashAtms, long criticalAtms,
                          BigDecimal totalCash, BigDecimal todaysWithdrawals, long todaysTransactions,
                          BigDecimal predictedDemand, long pendingRefills, long openAlerts, long highRiskAtms) { }
    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) { }
    public record AtmStatusItem(Long id, String atmCode, Long bankId, String location, AtmStatus status,
                                BigDecimal currentCash, BigDecimal minimumCashThreshold, boolean lowCash, boolean critical) { }
    public record DemandItem(Long atmId, LocalDate date, BigDecimal predictedDemand, BigDecimal confidenceScore, String modelVersion) { }
    public record TransactionItem(Long id, Long atmId, String transactionId, String transactionType,
                                  BigDecimal amount, Instant timestamp, boolean success) { }
    public record PredictionItem(Long id, Long atmId, LocalDate predictionDate, BigDecimal predictedDemand,
                                 BigDecimal confidenceScore, String modelVersion, Instant generatedAt) { }
    public record AlertItem(Long id, Long atmId, String alertType, Severity severity, String status,
                            String message, Instant createdAt, Instant resolvedAt) { }
    public record RefillItem(Long id, Long atmId, BigDecimal refillAmount, Instant refillDate, String status) { }
    public record RecommendationItem(Long id, Long atmId, BigDecimal currentCash, BigDecimal predictedDemand,
                                     BigDecimal recommendedRefillAmount, LocalDate recommendedRefillDate,
                                     String priority, String status, String reason) { }
}
