package com.atm.analytics.service;

import com.atm.analytics.dto.DashboardDtos;
import com.atm.analytics.dto.DashboardDtos.*;
import com.atm.analytics.repository.*;
import com.atm.domain.entity.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.function.Function;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
    private final DashboardAtmRepository atms;
    private final DashboardTransactionRepository transactions;
    private final DashboardPredictionRepository predictions;
    private final DashboardAlertRepository alerts;
    private final DashboardRefillRepository refills;
    private final DashboardRecommendationRepository recommendations;

    public DashboardService(DashboardAtmRepository atms, DashboardTransactionRepository transactions,
                            DashboardPredictionRepository predictions, DashboardAlertRepository alerts,
                            DashboardRefillRepository refills, DashboardRecommendationRepository recommendations) {
        this.atms = atms; this.transactions = transactions; this.predictions = predictions;
        this.alerts = alerts; this.refills = refills; this.recommendations = recommendations;
    }

    public Summary summary(Long bankId, LocalDate from, LocalDate to) {
        LocalDate start = from == null ? LocalDate.now(ZoneOffset.UTC) : from;
        LocalDate end = to == null ? start : to;
        Instant startInstant = start.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return new Summary(atms.countAll(bankId), atms.countActive(bankId), atms.countLowCash(bankId), atms.countCritical(bankId),
                zero(atms.sumCash(bankId)), zero(transactions.sumSuccessful(bankId, null, TransactionType.WITHDRAWAL, startInstant, endInstant)),
                transactions.count(bankId, null, startInstant, endInstant), zero(predictions.sumDemand(bankId, null, start, end)),
                refills.countPending(bankId), alerts.countOpen(bankId), recommendations.countHighRisk(bankId));
    }

    public PageResponse<AtmStatusItem> atmStatus(Long bankId, Long atmId, int page, int size) {
        return page(atms.search(bankId, atmId, pageRequest(page, size)), a -> new AtmStatusItem(a.getId(), a.getAtmCode(), a.getBank().getId(), a.getLocation(), a.getStatus(), a.getCurrentCash(), a.getMinimumCashThreshold(), a.getCurrentCash().compareTo(a.getMinimumCashThreshold()) <= 0, a.getCurrentCash().signum() == 0 || a.getStatus() == AtmStatus.OUT_OF_SERVICE));
    }

    public PageResponse<DemandItem> cashDemand(Long bankId, Long atmId, LocalDate from, LocalDate to, int page, int size) {
        return page(predictions.search(bankId, atmId, from, to, pageRequest(page, size)), p -> new DemandItem(p.getAtm().getId(), p.getPredictionDate(), p.getPredictedDemand(), p.getConfidenceScore(), p.getModelVersion()));
    }

    public PageResponse<TransactionItem> transactionList(Long bankId, Long atmId, LocalDate from, LocalDate to, int page, int size) {
        Instant start = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return page(transactions.search(bankId, atmId, start, end, pageRequest(page, size)), t -> new TransactionItem(t.getId(), t.getAtm().getId(), t.getTransactionId(), t.getTransactionType().name(), t.getAmount(), t.getTimestamp(), t.getSuccess()));
    }

    public PageResponse<PredictionItem> predictionList(Long bankId, Long atmId, LocalDate from, LocalDate to, int page, int size) {
        return page(predictions.search(bankId, atmId, from, to, pageRequest(page, size)), p -> new PredictionItem(p.getId(), p.getAtm().getId(), p.getPredictionDate(), p.getPredictedDemand(), p.getConfidenceScore(), p.getModelVersion(), p.getGeneratedAt()));
    }

    public PageResponse<AlertItem> alertList(Long bankId, Long atmId, LocalDate from, LocalDate to, String status, int page, int size) {
        Instant start = from == null ? null : from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = to == null ? null : to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return page(alerts.search(bankId, atmId, start, end, status, pageRequest(page, size)), a -> new AlertItem(a.getId(), a.getAtm().getId(), a.getAlertType().name(), a.getSeverity(), a.getStatus(), a.getMessage(), a.getCreatedAt(), a.getResolvedAt()));
    }

    public PageResponse<RefillItem> refillList(Long bankId, Long atmId, LocalDate from, LocalDate to, String status, int page, int size) {
        Instant start = from == null ? null : from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = to == null ? null : to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return page(refills.search(bankId, atmId, start, end, status, pageRequest(page, size)), r -> new RefillItem(r.getId(), r.getAtm().getId(), r.getRefillAmount(), r.getRefillDate(), r.getStatus().name()));
    }

    public PageResponse<RecommendationItem> recommendationList(Long bankId, Long atmId, LocalDate from, LocalDate to, String status, int page, int size) {
        return page(recommendations.search(bankId, atmId, from, to, status, pageRequest(page, size)), r -> new RecommendationItem(r.getId(), r.getAtm().getId(), r.getCurrentCash(), r.getPredictedDemand(), r.getRecommendedRefillAmount(), r.getRecommendedRefillDate(), r.getPriority().name(), r.getStatus().name(), r.getReason()));
    }

    private Pageable pageRequest(int page, int size) { return PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), Sort.by(Sort.Direction.DESC, "createdAt")); }
    private <E, T> PageResponse<T> page(Page<E> result, Function<E, T> mapper) { return new PageResponse<>(result.map(mapper).getContent(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages()); }
    private BigDecimal zero(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
}
