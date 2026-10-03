package com.atm.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.atm.analytics.dto.DashboardDtos.*;
import com.atm.analytics.repository.*;
import com.atm.domain.entity.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {
    @Mock DashboardAtmRepository atms;
    @Mock DashboardTransactionRepository transactions;
    @Mock DashboardPredictionRepository predictions;
    @Mock DashboardAlertRepository alerts;
    @Mock DashboardRefillRepository refills;
    @Mock DashboardRecommendationRepository recommendations;

    @Test
    void summaryUsesDatabaseAggregatesForRequestedBankAndDateRange() {
        when(atms.countAll(7L)).thenReturn(250L);
        when(atms.countActive(7L)).thenReturn(235L);
        when(atms.countLowCash(7L)).thenReturn(12L);
        when(atms.countCritical(7L)).thenReturn(3L);
        when(atms.sumCash(7L)).thenReturn(new BigDecimal("1000000.00"));
        when(transactions.sumSuccessful(eq(7L), isNull(), eq(TransactionType.WITHDRAWAL), any(), any())).thenReturn(new BigDecimal("42000.00"));
        when(transactions.count(eq(7L), isNull(), any(), any())).thenReturn(180L);
        when(predictions.sumDemand(eq(7L), isNull(), eq(LocalDate.of(2026, 9, 1)), eq(LocalDate.of(2026, 9, 7)))).thenReturn(new BigDecimal("425000.00"));
        when(refills.countPending(7L)).thenReturn(18L);
        when(alerts.countOpen(7L)).thenReturn(9L);
        when(recommendations.countHighRisk(7L)).thenReturn(6L);

        Summary summary = service().summary(7L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 7));

        assertThat(summary.totalAtms()).isEqualTo(250L);
        assertThat(summary.activeAtms()).isEqualTo(235L);
        assertThat(summary.predictedDemand()).isEqualByComparingTo("425000.00");
        assertThat(summary.openAlerts()).isEqualTo(9L);
        verify(transactions, never()).findAll();
    }

    @Test
    void atmStatusReturnsPagedFrontendItems() {
        ATM atm = new ATM();
        atm.setId(11L); atm.setAtmCode("ATM-11"); atm.setLocation("Main branch");
        atm.setStatus(AtmStatus.LOW_CASH); atm.setCurrentCash(new BigDecimal("10"));
        atm.setMinimumCashThreshold(new BigDecimal("100"));
        Bank bank = new Bank(); bank.setId(7L); atm.setBank(bank);
        when(atms.search(eq(7L), eq(11L), any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(atm), PageRequest.of(0, 25), 1));

        PageResponse<AtmStatusItem> result = service().atmStatus(7L, 11L, 0, 25);

        assertThat(result.totalElements()).isEqualTo(1);
        assertThat(result.content().get(0).lowCash()).isTrue();
        assertThat(result.content().get(0).bankId()).isEqualTo(7L);
        assertThat(result.content().get(0).riskLevel()).isEqualTo(Severity.HIGH);
    }

    @Test
    void atmStatusUsesHighestActiveAlertSeverityAsRiskLevel() {
        ATM atm = new ATM();
        atm.setId(11L); atm.setAtmCode("ATM-11"); atm.setLocation("Main branch");
        atm.setStatus(AtmStatus.ACTIVE); atm.setCurrentCash(new BigDecimal("500"));
        atm.setMinimumCashThreshold(new BigDecimal("100"));
        Bank bank = new Bank(); bank.setId(7L); atm.setBank(bank);
        when(atms.search(eq(7L), eq(11L), any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(atm), PageRequest.of(0, 25), 1));
        when(alerts.findActiveRiskRanksByAtmIds(List.of(11L))).thenReturn(List.<Object[]>of(new Object[]{11L, 2}));

        PageResponse<AtmStatusItem> result = service().atmStatus(7L, 11L, 0, 25);

        assertThat(result.content().get(0).riskLevel()).isEqualTo(Severity.MEDIUM);
    }

    private DashboardService service() {
        return new DashboardService(atms, transactions, predictions, alerts, refills, recommendations);
    }
}
