package com.atm.prediction.service;

import com.atm.common.exception.BusinessRuleException;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.dto.PredictionEvaluationDto;
import com.atm.domain.entity.ATM;
import com.atm.domain.entity.ATMTransaction;
import com.atm.domain.entity.Prediction;
import com.atm.domain.entity.PredictionEvaluation;
import com.atm.domain.entity.TransactionType;
import com.atm.domain.repository.ATMTransactionRepository;
import com.atm.domain.repository.PredictionEvaluationRepository;
import com.atm.domain.repository.PredictionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class PredictionEvaluationService {
    private final PredictionRepository predictions;
    private final ATMTransactionRepository transactions;
    private final PredictionEvaluationRepository evaluations;

    public PredictionEvaluationService(PredictionRepository predictions,
                                       ATMTransactionRepository transactions,
                                       PredictionEvaluationRepository evaluations) {
        this.predictions = predictions;
        this.transactions = transactions;
        this.evaluations = evaluations;
    }

    @Transactional
    public PredictionEvaluationDto evaluatePrediction(Long predictionId) {
        Prediction prediction = predictions.findById(predictionId)
            .orElseThrow(() -> new ResourceNotFoundException("Prediction not found", "PREDICTION_NOT_FOUND"));

        ATM atm = prediction.getAtm();
        if (atm == null || atm.getId() == null) {
            throw new BusinessRuleException("Prediction is missing ATM context", "PREDICTION_ATM_MISSING");
        }

        LocalDate predictionDate = prediction.getPredictionDate();
        if (!predictionDate.isBefore(LocalDate.now(ZoneOffset.UTC))) {
            throw new BusinessRuleException("Prediction demand window is not complete", "PREDICTION_WINDOW_OPEN");
        }
        Instant from = predictionDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = predictionDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusNanos(1L);

        List<ATMTransaction> actualDemand = transactions.findByAtmIdAndTimestampBetween(atm.getId(), from, to).stream()
                .filter(t -> Boolean.TRUE.equals(t.getSuccess()))
                .filter(t -> t.getTransactionType() == TransactionType.WITHDRAWAL)
                .toList();

        BigDecimal actualDemandAmount = actualDemand.stream()
                .map(ATMTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal predictedDemand = prediction.getPredictedDemand() == null ? BigDecimal.ZERO : prediction.getPredictedDemand();
        BigDecimal absoluteError = actualDemandAmount.subtract(predictedDemand).abs();
        BigDecimal percentageError = actualDemandAmount.compareTo(BigDecimal.ZERO) == 0
            ? null
            : absoluteError.divide(actualDemandAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        return evaluations.findByPredictionId(predictionId)
                .map(this::toDto)
                .orElseGet(() -> {
                    PredictionEvaluation entity = new PredictionEvaluation();
                    entity.setPrediction(prediction);
                    entity.setAtm(atm);
                    entity.setPredictionDate(predictionDate);
                    entity.setModelVersion(prediction.getModelVersion());
                    entity.setActualDemand(actualDemandAmount);
                    entity.setPredictedDemand(predictedDemand);
                    entity.setAbsoluteError(absoluteError);
                    entity.setPercentageError(percentageError);
                    entity.setEvaluatedAt(Instant.now());
                    PredictionEvaluation saved = evaluations.save(entity);
                    return toDto(saved);
                });
    }

    private PredictionEvaluationDto toDto(PredictionEvaluation evaluation) {
        return new PredictionEvaluationDto(
                evaluation.getId(),
                evaluation.getPrediction().getId(),
                evaluation.getAtm().getId(),
                evaluation.getPredictionDate(),
                evaluation.getModelVersion(),
                evaluation.getActualDemand(),
                evaluation.getPredictedDemand(),
                evaluation.getAbsoluteError(),
                evaluation.getPercentageError(),
                evaluation.getEvaluatedAt()
        );
    }
}
