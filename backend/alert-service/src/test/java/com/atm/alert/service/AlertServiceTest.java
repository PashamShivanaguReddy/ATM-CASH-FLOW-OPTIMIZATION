package com.atm.alert.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.atm.alert.dto.AlertEvaluationRequest;
import com.atm.domain.entity.ATM;
import com.atm.domain.entity.Alert;
import com.atm.domain.entity.AlertType;
import com.atm.domain.entity.Severity;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.ATMTransactionRepository;
import com.atm.domain.repository.AlertRepository;
import com.atm.domain.repository.AuditLogRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {
    @Mock private ATMRepository atms;
    @Mock private ATMTransactionRepository transactions;
    @Mock private AlertRepository alerts;
    @Mock private AuditLogRepository audits;

    private AlertService service;
    private ATM atm;

    @BeforeEach
    void setUp() {
        service = new AlertService(atms, transactions, alerts, audits);
        atm = new ATM();
        atm.setId(7L);
        atm.setCurrentCash(BigDecimal.valueOf(40000));
        atm.setMinimumCashThreshold(BigDecimal.valueOf(15000));
        atm.setMaximumCashThreshold(BigDecimal.valueOf(100000));
        lenient().when(atms.findById(7L)).thenReturn(Optional.of(atm));
        lenient().when(transactions.findByAtmIdAndTimestampBetween(any(), any(), any())).thenReturn(List.of());
        lenient().when(alerts.findFirstByAtmIdAndAlertTypeAndStatusIn(any(), any(), any())).thenReturn(Optional.empty());
        lenient().when(alerts.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createsCriticalStockoutAlertWhenDemandExceedsCashAndReserve() {
        var created = service.evaluate(new AlertEvaluationRequest(7L, BigDecimal.valueOf(85000)));

        var stockout = created.stream().filter(alert -> alert.alertType() == AlertType.STOCKOUT_RISK).findFirst().orElseThrow();
        assertEquals(Severity.CRITICAL, stockout.severity());
        verify(alerts).save(any(Alert.class));
        verify(audits).save(any());
    }

    @Test
    void doesNotCreateDuplicateOpenAlert() {
        Alert existing = new Alert();
        existing.setAlertType(AlertType.STOCKOUT_RISK);
        existing.setStatus(AlertService.ACTIVE);
        when(alerts.findFirstByAtmIdAndAlertTypeAndStatusIn(7L, AlertType.STOCKOUT_RISK, List.of(AlertService.ACTIVE, AlertService.ACKNOWLEDGED)))
            .thenReturn(Optional.of(existing));

        service.evaluate(new AlertEvaluationRequest(7L, BigDecimal.valueOf(85000)));

        verify(alerts, never()).save(any(Alert.class));
    }

    @Test
    void resolveSetsTimestampAndAuditsTransition() {
        Alert existing = new Alert();
        existing.setId(12L);
        existing.setAtm(atm);
        existing.setStatus(AlertService.ACTIVE);
        existing.setAlertType(AlertType.LOW_CASH);
        existing.setSeverity(Severity.HIGH);
        existing.setMessage("low");
        when(alerts.findById(12L)).thenReturn(Optional.of(existing));
        when(alerts.save(existing)).thenReturn(existing);

        var result = service.resolve(12L);

        assertEquals(AlertService.RESOLVED, result.status());
        org.junit.jupiter.api.Assertions.assertNotNull(result.resolvedAt());
        verify(audits).save(any());
    }
}