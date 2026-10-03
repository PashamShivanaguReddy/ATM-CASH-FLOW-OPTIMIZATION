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
        Map<String, BigDecimal> features = features(atm, history, predictionDate);
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

    private Map<String, BigDecimal> features(ATM atm, List<ATMTransaction> history, LocalDate predictionDate) {
        List<BigDecimal> successAmounts = history.stream()
                .filter(transaction -> Boolean.TRUE.equals(transaction.getSuccess())
                        && transaction.getTransactionType() == TransactionType.WITHDRAWAL)
                .map(ATMTransaction::getAmount)
                .sorted()
                .toList();

        BigDecimal historicalDemand = successAmounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal previousDayWithdrawal = successAmounts.isEmpty() ? BigDecimal.ZERO : successAmounts.get(successAmounts.size() - 1);
        BigDecimal rollingAverage3 = average(lastN(successAmounts, 3));
        BigDecimal rollingAverage7 = average(lastN(successAmounts, 7));
        BigDecimal rollingAverage14 = average(lastN(successAmounts, 14));
        BigDecimal rollingAverage30 = average(lastN(successAmounts, 30));
        BigDecimal monthlyAverage = rollingAverage30;
        BigDecimal quarterlyAverage = rollingAverage30;
        BigDecimal previousDayBefore = successAmounts.size() >= 2 ? successAmounts.get(successAmounts.size() - 2) : BigDecimal.ZERO;
        BigDecimal growthRate = previousDayBefore.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO : previousDayWithdrawal.subtract(previousDayBefore).divide(previousDayBefore, 6, RoundingMode.HALF_UP);
        BigDecimal cashCapacity = atm.getCashCapacity() == null ? BigDecimal.ZERO : atm.getCashCapacity();
        BigDecimal currentCash = atm.getCurrentCash() == null ? BigDecimal.ZERO : atm.getCurrentCash();
        BigDecimal cashRemainingPercentage = cashCapacity.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO : currentCash.multiply(BigDecimal.valueOf(100)).divide(cashCapacity, 6, RoundingMode.HALF_UP);
        BigDecimal cashUtilisation = BigDecimal.valueOf(100).subtract(cashRemainingPercentage).max(BigDecimal.ZERO);

        Map<String, BigDecimal> features = new LinkedHashMap<>();
        features.put("previous_day_withdrawal", previousDayWithdrawal);
        features.put("rolling_average_3", rollingAverage3);
        features.put("rolling_average_7", rollingAverage7);
        features.put("rolling_average_14", rollingAverage14);
        features.put("rolling_average_30", rollingAverage30);
        features.put("monthly_average", monthlyAverage);
        features.put("quarterly_average", quarterlyAverage);
        features.put("withdrawal_growth_rate", growthRate);
        features.put("cash_remaining_percentage", cashRemainingPercentage);
        features.put("festival_weight", BigDecimal.ONE);
        features.put("holiday_weight", BigDecimal.ONE);
        features.put("salary_day_weight", BigDecimal.ONE);
        features.put("weather_weight", BigDecimal.ONE);
        features.put("event_weight", BigDecimal.ONE);
        features.put("atm_type_encoded", BigDecimal.valueOf(atmTypeCode(atm)));
        features.put("city_encoded", BigDecimal.valueOf(cityCode(atm)));
        features.put("days_since_last_refill", BigDecimal.valueOf(atm.getLastRefillAt() == null ? 0L : java.time.temporal.ChronoUnit.DAYS.between(atm.getLastRefillAt().atZone(ZoneOffset.UTC).toLocalDate(), predictionDate)));
        features.put("cash_utilisation", cashUtilisation);
        features.put("historicalDemand", historicalDemand);
        features.put("averageDailyWithdrawal", historicalDemand.divide(BigDecimal.valueOf(Math.max(1L, successAmounts.size())), 6, RoundingMode.HALF_UP));
        features.put("peakHourDemand", successAmounts.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO));
        features.put("dayOfWeek", BigDecimal.valueOf(predictionDate.getDayOfWeek().getValue() - 1L));
        features.put("month", BigDecimal.valueOf(predictionDate.getMonthValue()));
        return features;
    }

    private BigDecimal average(List<BigDecimal> values) {
        if (values == null || values.isEmpty()) return BigDecimal.ZERO;
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(values.size()), 6, RoundingMode.HALF_UP);
    }

    private List<BigDecimal> lastN(List<BigDecimal> values, int n) {
        if (values == null || values.isEmpty()) return List.of();
        int fromIndex = Math.max(0, values.size() - n);
        return values.subList(fromIndex, values.size());
    }

    private long atmTypeCode(ATM atm) {
        if (atm == null || atm.getAtmType() == null) return 0L;
        return switch (atm.getAtmType()) {
            case STANDARD -> 0L;
            case DRIVE_THROUGH -> 1L;
            case KIOSK -> 2L;
        };
    }

    private long cityCode(ATM atm) {
        if (atm == null || atm.getCity() == null || atm.getCity().isBlank()) return 0L;
        return Math.abs(atm.getCity().hashCode()) % 10L;
    }

    private ATM findAtm(Long atmId) {
        return atms.findById(atmId).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
    }

    private PredictionDto toDto(Prediction prediction) {
        return new PredictionDto(prediction.getId(), prediction.getAtm().getId(), prediction.getPredictionDate(),
            prediction.getPredictedDemand(), prediction.getConfidenceScore(), prediction.getModelVersion(), prediction.getGeneratedAt());
    }
}
