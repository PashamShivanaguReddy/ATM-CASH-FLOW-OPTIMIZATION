package com.atm.prediction.service;

import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.dto.PredictionDto;
import com.atm.domain.entity.ATM;
import com.atm.domain.entity.ATMTransaction;
import com.atm.domain.entity.Prediction;
import com.atm.domain.entity.TransactionType;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.ATMTransactionRepository;
import com.atm.domain.repository.PredictionRepository;
import com.atm.prediction.client.MLClient;
import com.atm.prediction.client.AlertClient;
import com.atm.prediction.dto.MLPredictionRequest;
import com.atm.prediction.dto.MLPredictionResponse;
import com.atm.prediction.dto.PredictionRequest;
import com.atm.common.event.EventType;
import com.atm.common.event.KafkaEventPublisher;
import com.atm.common.event.PredictionGeneratedEvent;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PredictionService {
    private static final int HISTORY_DAYS = 30;
    private static final Logger log = LoggerFactory.getLogger(PredictionService.class);
    private final ATMRepository atms;
    private final ATMTransactionRepository transactions;
    private final PredictionRepository predictions;
    private final MLClient mlClient;
    private final AlertClient alertClient;
    private final KafkaEventPublisher eventPublisher;

    @Autowired
    public PredictionService(ATMRepository atms, ATMTransactionRepository transactions,
                             PredictionRepository predictions, MLClient mlClient, AlertClient alertClient,
                             KafkaEventPublisher eventPublisher) {
        this.atms = atms;
        this.transactions = transactions;
        this.predictions = predictions;
        this.mlClient = mlClient;
        this.alertClient = alertClient;
        this.eventPublisher = eventPublisher;
    }

    public PredictionService(ATMRepository atms, ATMTransactionRepository transactions,
                             PredictionRepository predictions, MLClient mlClient) {
        this(atms, transactions, predictions, mlClient, null, null);
    }

    @Transactional
    public PredictionDto create(Long atmId, PredictionRequest request) {
        return create(atmId, request, true);
    }

    public PredictionDto createFromEvent(Long atmId, PredictionRequest request) {
        return create(atmId, request, false);
    }

    private PredictionDto create(Long atmId, PredictionRequest request, boolean evaluateAlerts) {
        ATM atm = findAtm(atmId);
        LocalDate predictionDate = request.predictionDate();
        Instant from = predictionDate.minusDays(HISTORY_DAYS).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = predictionDate.atStartOfDay(ZoneOffset.UTC).toInstant().minusNanos(1);
        List<ATMTransaction> history = transactions.findByAtmIdAndTimestampBetween(atmId, from, to).stream()
            .filter(transaction -> Boolean.TRUE.equals(transaction.getSuccess())
                && transaction.getTransactionType() == TransactionType.WITHDRAWAL)
            .toList();
        Map<String, BigDecimal> features = features(history, predictionDate);
        MLPredictionRequest mlRequest = new MLPredictionRequest(atm.getAtmCode(), predictionDate, features);
        log.info("Prediction request atmCode={} predictionDate={} featureCount={}", atm.getAtmCode(), predictionDate, features.size());
        MLPredictionResponse mlResponse = mlClient.predict(mlRequest);

        Prediction prediction = new Prediction();
        prediction.setAtm(atm);
        prediction.setPredictionDate(predictionDate);
        prediction.setPredictedDemand(mlResponse.predictedDemand());
        prediction.setConfidenceScore(mlResponse.confidenceScore());
        prediction.setModelVersion(mlResponse.modelVersion());
        prediction.setGeneratedAt(Instant.now());
        Prediction saved = predictions.save(prediction);
        if (evaluateAlerts && alertClient != null) alertClient.evaluate(atmId, saved.getPredictedDemand());
        if (eventPublisher != null) eventPublisher.publish(EventType.PREDICTION_GENERATED,
            new PredictionGeneratedEvent(saved.getId(), atmId, saved.getPredictionDate(), saved.getPredictedDemand(),
                saved.getConfidenceScore(), saved.getModelVersion()));
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<PredictionDto> list(Long atmId) {
        findAtm(atmId);
        return predictions.findByAtmIdAndPredictionDateBetweenOrderByPredictionDateAsc(
                atmId, LocalDate.now(ZoneOffset.UTC).minusYears(10), LocalDate.now(ZoneOffset.UTC).plusYears(10))
            .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public PredictionDto latest(Long atmId) {
        findAtm(atmId);
        return predictions.findFirstByAtmIdOrderByPredictionDateDescGeneratedAtDesc(atmId)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Prediction not found", "PREDICTION_NOT_FOUND"));
    }

    @Transactional(readOnly = true)
    public List<PredictionDto> forecast(Long atmId) {
        findAtm(atmId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return predictions.findByAtmIdAndPredictionDateBetweenOrderByPredictionDateAsc(atmId, today, today.plusDays(7))
            .stream().map(this::toDto).toList();
    }

    private Map<String, BigDecimal> features(List<ATMTransaction> history, LocalDate predictionDate) {
        BigDecimal historicalDemand = history.stream().map(ATMTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageDailyWithdrawal = historicalDemand.divide(BigDecimal.valueOf(HISTORY_DAYS), 2, RoundingMode.HALF_UP);
        BigDecimal peakHourDemand = history.stream()
            .collect(Collectors.groupingBy(transaction -> transaction.getTimestamp().atZone(ZoneOffset.UTC).getHour(),
                Collectors.reducing(BigDecimal.ZERO, ATMTransaction::getAmount, BigDecimal::add)))
            .values().stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        Map<String, BigDecimal> features = new LinkedHashMap<>();
        features.put("historicalDemand", historicalDemand);
        features.put("averageDailyWithdrawal", averageDailyWithdrawal);
        features.put("peakHourDemand", peakHourDemand);
        features.put("dayOfWeek", BigDecimal.valueOf(predictionDate.getDayOfWeek().getValue() - 1L));
        features.put("month", BigDecimal.valueOf(predictionDate.getMonthValue()));
        return features;
    }

    private ATM findAtm(Long atmId) {
        return atms.findById(atmId).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
    }

    private PredictionDto toDto(Prediction prediction) {
        return new PredictionDto(prediction.getId(), prediction.getAtm().getId(), prediction.getPredictionDate(),
            prediction.getPredictedDemand(), prediction.getConfidenceScore(), prediction.getModelVersion(), prediction.getGeneratedAt());
    }
}
