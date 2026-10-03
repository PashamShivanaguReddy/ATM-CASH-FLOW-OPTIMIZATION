package com.atm.prediction.service;

import com.atm.domain.entity.ATM;
import com.atm.domain.entity.ATMTransaction;
import com.atm.domain.entity.Prediction;
import com.atm.domain.entity.TransactionType;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.ATMTransactionRepository;
import com.atm.domain.repository.PredictionEvaluationRepository;
import com.atm.domain.repository.PredictionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PredictionEvaluationServiceTest {
    @Mock private ATMRepository atms;
    @Mock private ATMTransactionRepository transactions;
    @Mock private PredictionRepository predictions;
    @Mock private PredictionEvaluationRepository evaluations;

    @Test
    void evaluatesPredictionAgainstActualWithdrawalDemand() {
        PredictionEvaluationService service = new PredictionEvaluationService(predictions, transactions, evaluations);
        ATM atm = new ATM(); atm.setId(7L);
        Prediction prediction = new Prediction(); prediction.setId(99L); prediction.setAtm(atm); prediction.setPredictionDate(LocalDate.of(2026, 9, 15)); prediction.setPredictedDemand(new BigDecimal("2500")); prediction.setModelVersion("v1");
        when(predictions.findById(99L)).thenReturn(Optional.of(prediction));
        when(evaluations.findByPredictionId(99L)).thenReturn(Optional.empty());
        ATMTransaction t1 = new ATMTransaction(); t1.setAtm(atm); t1.setTransactionType(TransactionType.WITHDRAWAL); t1.setAmount(new BigDecimal("2000")); t1.setSuccess(true); t1.setTimestamp(Instant.parse("2026-09-15T10:00:00Z"));
        ATMTransaction t2 = new ATMTransaction(); t2.setAtm(atm); t2.setTransactionType(TransactionType.WITHDRAWAL); t2.setAmount(new BigDecimal("3000")); t2.setSuccess(true); t2.setTimestamp(Instant.parse("2026-09-15T14:00:00Z"));
        when(transactions.findByAtmIdAndTimestampBetween(7L, Instant.parse("2026-09-15T00:00:00Z"), Instant.parse("2026-09-15T23:59:59.999999999Z"))).thenReturn(List.of(t1, t2));
        when(evaluations.save(org.mockito.ArgumentMatchers.any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.evaluatePrediction(99L);

        assertThat(result).isNotNull();
        assertThat(result.actualDemand()).isEqualByComparingTo("5000");
        assertThat(result.absoluteError()).isEqualByComparingTo("2500");
        assertThat(result.percentageError()).isEqualByComparingTo("50.0000");
    }
}
