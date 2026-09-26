package com.atm.prediction.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.entity.ATM;
import com.atm.domain.entity.ATMTransaction;
import com.atm.domain.entity.TransactionType;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.ATMTransactionRepository;
import com.atm.domain.repository.PredictionRepository;
import com.atm.prediction.client.MLClient;
import com.atm.prediction.dto.MLPredictionResponse;
import com.atm.prediction.dto.PredictionRequest;
import com.atm.prediction.exception.InvalidPredictionException;
import com.atm.prediction.exception.MLServiceException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;

@ExtendWith(MockitoExtension.class)
class PredictionServiceTest {
    private static final Long ATM_ID = 7L;
    private static final LocalDate PREDICTION_DATE = LocalDate.of(2026, 9, 12);

    @Mock private ATMRepository atms;
    @Mock private ATMTransactionRepository transactions;
    @Mock private PredictionRepository predictions;
    @Mock private MLClient mlClient;

    private PredictionService service;
    private ATM atm;

    @BeforeEach
    void setUp() {
        service = new PredictionService(atms, transactions, predictions, mlClient);
        atm = new ATM();
        atm.setId(ATM_ID);
        atm.setAtmCode("ATM0007");
        when(atms.findById(ATM_ID)).thenReturn(Optional.of(atm));
        lenient().when(transactions.findByAtmIdAndTimestampBetween(any(), any(), any())).thenReturn(List.of(withdrawal(120), withdrawal(80)));
    }

    @Test
    void successfulPredictionSavesAndReturnsMlResult() {
        when(mlClient.predict(any())).thenReturn(new MLPredictionResponse("ATM0007", PREDICTION_DATE,
            BigDecimal.valueOf(1500), BigDecimal.valueOf(0.91), "model-2026-01"));
        when(predictions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.create(ATM_ID, new PredictionRequest("ATM0007", PREDICTION_DATE, Map.of()));

        assertEquals(ATM_ID, result.atmId());
        assertEquals(BigDecimal.valueOf(1500), result.predictedDemand());
        assertEquals("model-2026-01", result.modelVersion());
        var request = ArgumentCaptor.forClass(com.atm.prediction.dto.MLPredictionRequest.class);
        verify(mlClient).predict(request.capture());
        assertEquals(BigDecimal.valueOf(200), request.getValue().features().get("historicalDemand"));
        verify(predictions).save(any());
    }

    @Test
    void mlTimeoutIsPropagatedAsServiceFailure() {
        when(mlClient.predict(any())).thenThrow(new MLServiceException("timeout", "ML_SERVICE_UNAVAILABLE", null));

        assertThrows(MLServiceException.class, () -> service.create(ATM_ID,
            new PredictionRequest(null, PREDICTION_DATE, Map.of())));
        verify(predictions, never()).save(any());
    }

    @Test
    void mlUnavailableIsPropagatedAsServiceFailure() {
        when(mlClient.predict(any())).thenThrow(new MLServiceException("unavailable", "ML_SERVICE_UNAVAILABLE", null));

        assertThrows(MLServiceException.class, () -> service.create(ATM_ID,
            new PredictionRequest(null, PREDICTION_DATE, Map.of())));
    }

    @Test
    void invalidMlResponseIsNotPersisted() {
        when(mlClient.predict(any())).thenThrow(new InvalidPredictionException("invalid"));

        assertThrows(InvalidPredictionException.class, () -> service.create(ATM_ID,
            new PredictionRequest(null, PREDICTION_DATE, Map.of())));
        verify(predictions, never()).save(any());
    }

    @Test
    void missingAtmStopsBeforeCallingMl() {
        when(atms.findById(ATM_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(ATM_ID,
            new PredictionRequest(null, PREDICTION_DATE, Map.of())));
        verify(mlClient, never()).predict(any());
    }

    @Test
    void databaseFailureIsPropagatedWithoutCallingMl() {
        when(transactions.findByAtmIdAndTimestampBetween(any(), any(), any()))
            .thenThrow(new DataAccessResourceFailureException("database unavailable"));

        assertThrows(DataAccessResourceFailureException.class, () -> service.create(ATM_ID,
            new PredictionRequest(null, PREDICTION_DATE, Map.of())));
        verify(mlClient, never()).predict(any());
    }

    private ATMTransaction withdrawal(int amount) {
        ATMTransaction transaction = new ATMTransaction();
        transaction.setAmount(BigDecimal.valueOf(amount));
        transaction.setTransactionType(TransactionType.WITHDRAWAL);
        transaction.setSuccess(true);
        transaction.setTimestamp(Instant.parse("2026-09-10T10:00:00Z"));
        return transaction;
    }
}
