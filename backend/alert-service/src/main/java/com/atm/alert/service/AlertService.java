package com.atm.alert.service;

import com.atm.alert.dto.AlertEvaluationRequest;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.common.event.EventType;
import com.atm.common.event.KafkaEventPublisher;
import com.atm.domain.dto.AlertDto;
import com.atm.domain.entity.ATM;
import com.atm.domain.entity.ATMTransaction;
import com.atm.domain.entity.Alert;
import com.atm.domain.entity.AlertType;
import com.atm.domain.entity.AtmStatus;
import com.atm.domain.entity.AuditLog;
import com.atm.domain.entity.Severity;
import com.atm.domain.entity.TransactionType;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.ATMTransactionRepository;
import com.atm.domain.repository.AlertRepository;
import com.atm.domain.repository.AuditLogRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AlertService {
    public static final String ACTIVE = "ACTIVE";
    public static final String ACKNOWLEDGED = "ACKNOWLEDGED";
    public static final String RESOLVED = "RESOLVED";
    private static final List<String> OPEN_STATUSES = List.of(ACTIVE, ACKNOWLEDGED);
    private static final Duration ACTIVITY_WINDOW = Duration.ofHours(24);

    private final ATMRepository atms;
    private final ATMTransactionRepository transactions;
    private final AlertRepository alerts;
    private final AuditLogRepository audits;
    private final KafkaEventPublisher eventPublisher;

    @Autowired
    public AlertService(ATMRepository atms, ATMTransactionRepository transactions,
                        AlertRepository alerts, AuditLogRepository audits, KafkaEventPublisher eventPublisher) {
        this.atms = atms;
        this.transactions = transactions;
        this.alerts = alerts;
        this.audits = audits;
        this.eventPublisher = eventPublisher;
    }

    public AlertService(ATMRepository atms, ATMTransactionRepository transactions,
                        AlertRepository alerts, AuditLogRepository audits) {
        this(atms, transactions, alerts, audits, null);
    }

    @Transactional(readOnly = true)
    public List<AlertDto> list(Long atmId, String status) {
        List<Alert> results = atmId != null ? alerts.findByAtmIdOrderByCreatedAtDesc(atmId)
            : status != null ? alerts.findByStatusOrderByCreatedAtDesc(status) : alerts.findAll();
        if (atmId != null && status != null) results = results.stream().filter(alert -> status.equals(alert.getStatus())).toList();
        return results.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public AlertDto get(Long id) { return toDto(find(id)); }

    @Transactional
    public List<AlertDto> evaluate(AlertEvaluationRequest request) {
        ATM atm = atms.findById(request.atmId()).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
        List<AlertDraft> drafts = drafts(atm, request.predictedDemand());
        List<AlertDto> created = new ArrayList<>();
        for (AlertDraft draft : drafts) {
            if (alerts.findFirstByAtmIdAndAlertTypeAndStatusIn(atm.getId(), draft.type(), OPEN_STATUSES).isPresent()) continue;
            Alert alert = new Alert();
            alert.setAtm(atm);
            alert.setAlertType(draft.type());
            alert.setSeverity(draft.severity());
            alert.setMessage(draft.message());
            alert.setStatus(ACTIVE);
            Alert saved = alerts.save(alert);
            audit(saved, "ALERT_CREATED", null, saved.getSeverity().name());
            if (eventPublisher != null) eventPublisher.publish(EventType.ALERT_GENERATED,
                new com.atm.common.event.PredictionGeneratedEvent(null, saved.getAtm().getId(), null,
                    request.predictedDemand(), null, null));
            created.add(toDto(saved));
        }
        return created;
    }

    @Transactional
    public AlertDto acknowledge(Long id) {
        Alert alert = find(id);
        if (RESOLVED.equals(alert.getStatus())) return toDto(alert);
        String oldStatus = alert.getStatus();
        alert.setStatus(ACKNOWLEDGED);
        Alert saved = alerts.save(alert);
        audit(saved, "ALERT_ACKNOWLEDGED", oldStatus, ACKNOWLEDGED);
        return toDto(saved);
    }

    @Transactional
    public AlertDto resolve(Long id) {
        Alert alert = find(id);
        if (RESOLVED.equals(alert.getStatus())) return toDto(alert);
        String oldStatus = alert.getStatus();
        alert.setStatus(RESOLVED);
        alert.setResolvedAt(Instant.now());
        Alert saved = alerts.save(alert);
        audit(saved, "ALERT_RESOLVED", oldStatus, RESOLVED);
        return toDto(saved);
    }

    private List<AlertDraft> drafts(ATM atm, BigDecimal predictedDemand) {
        List<AlertDraft> drafts = new ArrayList<>();
        BigDecimal currentCash = atm.getCurrentCash();
        BigDecimal reserve = atm.getMinimumCashThreshold();
        if (atm.getStatus() == AtmStatus.OUT_OF_SERVICE) drafts.add(new AlertDraft(AlertType.ATM_OUT_OF_SERVICE, Severity.CRITICAL, "ATM is out of service"));
        if (currentCash.compareTo(reserve) <= 0) {
            Severity severity = currentCash.signum() == 0 ? Severity.CRITICAL : Severity.HIGH;
            drafts.add(new AlertDraft(AlertType.LOW_CASH, severity, "ATM cash is at or below the minimum threshold"));
        }
        if (currentCash.compareTo(predictedDemand.add(reserve)) < 0) {
            drafts.add(new AlertDraft(AlertType.STOCKOUT_RISK, currentCash.compareTo(predictedDemand) < 0 ? Severity.CRITICAL : Severity.HIGH,
                "Predicted demand exceeds available cash and safety reserve"));
        }
        if (predictedDemand.compareTo(atm.getMaximumCashThreshold()) > 0) drafts.add(new AlertDraft(AlertType.HIGH_DEMAND, Severity.HIGH, "Predicted demand exceeds the ATM cash capacity threshold"));
        Instant now = Instant.now();
        List<ATMTransaction> recent = transactions.findByAtmIdAndTimestampBetween(atm.getId(), now.minus(ACTIVITY_WINDOW), now);
        long failed = recent.stream().filter(transaction -> !Boolean.TRUE.equals(transaction.getSuccess())).count();
        BigDecimal withdrawals = recent.stream().filter(transaction -> Boolean.TRUE.equals(transaction.getSuccess()) && transaction.getTransactionType() == TransactionType.WITHDRAWAL)
            .map(ATMTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (failed >= 3 || withdrawals.compareTo(atm.getMaximumCashThreshold()) > 0) drafts.add(new AlertDraft(AlertType.UNUSUAL_ACTIVITY, Severity.MEDIUM, "ATM transaction behavior is unusual"));
        return drafts;
    }

    private Alert find(Long id) { return alerts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Alert not found", "ALERT_NOT_FOUND")); }
    private void audit(Alert alert, String action, String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setAction(action); log.setEntityType("ALERT"); log.setEntityId(alert.getId());
        log.setOldValue(oldValue); log.setNewValue(newValue); log.setTimestamp(Instant.now()); audits.save(log);
    }
    private AlertDto toDto(Alert alert) { return new AlertDto(alert.getId(), alert.getAtm().getId(), alert.getAlertType(), alert.getSeverity(), alert.getMessage(), alert.getStatus(), alert.getCreatedAt(), alert.getResolvedAt()); }
    private record AlertDraft(AlertType type, Severity severity, String message) { }
}