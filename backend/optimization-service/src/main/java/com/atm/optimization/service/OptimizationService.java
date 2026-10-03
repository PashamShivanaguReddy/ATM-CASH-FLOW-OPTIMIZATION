package com.atm.optimization.service;

import com.atm.common.event.EventType;
import com.atm.common.event.KafkaEventPublisher;
import com.atm.common.event.RecommendationCreatedEvent;
import com.atm.common.exception.BusinessRuleException;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.dto.OptimizationRecommendationDto;
import com.atm.domain.entity.ATM;
import com.atm.domain.entity.OptimizationRecommendation;
import com.atm.domain.entity.Prediction;
import com.atm.domain.entity.PredictionEvaluation;
import com.atm.domain.entity.RecommendationPriority;
import com.atm.domain.entity.RecommendationStatus;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.OptimizationRecommendationRepository;
import com.atm.domain.repository.PredictionEvaluationRepository;
import com.atm.domain.repository.PredictionRepository;
import com.atm.optimization.config.OptimizationProperties;
import com.atm.optimization.dto.RecommendationRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class OptimizationService {
    private final ATMRepository atms;
    private final PredictionRepository predictions;
    private final OptimizationRecommendationRepository recommendations;
    private final PredictionEvaluationRepository evaluations;
    private final OptimizationProperties properties;
    private final KafkaEventPublisher eventPublisher;

    @Autowired
    public OptimizationService(ATMRepository atms, PredictionRepository predictions,
                               OptimizationRecommendationRepository recommendations,
                               OptimizationProperties properties) {
        this(atms, predictions, recommendations, null, properties, null);
    }

    public OptimizationService(ATMRepository atms, PredictionRepository predictions,
                               OptimizationRecommendationRepository recommendations,
                               PredictionEvaluationRepository evaluations,
                               OptimizationProperties properties) {
        this(atms, predictions, recommendations, evaluations, properties, null);
    }

    public OptimizationService(ATMRepository atms, PredictionRepository predictions,
                               OptimizationRecommendationRepository recommendations,
                               OptimizationProperties properties, KafkaEventPublisher eventPublisher) {
        this(atms, predictions, recommendations, null, properties, eventPublisher);
    }

    public OptimizationService(ATMRepository atms, PredictionRepository predictions,
                               OptimizationRecommendationRepository recommendations,
                               PredictionEvaluationRepository evaluations,
                               OptimizationProperties properties, KafkaEventPublisher eventPublisher) {
        this.atms = atms;
        this.predictions = predictions;
        this.recommendations = recommendations;
        this.evaluations = evaluations;
        this.properties = properties;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public OptimizationRecommendationDto recommend(Long atmId, RecommendationRequest request) {
        ATM atm = atms.findByIdForUpdate(atmId).orElseThrow(() -> notFound("ATM not found", "ATM_NOT_FOUND"));
        if (request.predictionId() != null && recommendations.existsByPredictionId(request.predictionId())) {
            return recommendations.findByPredictionId(request.predictionId())
                    .map(this::toDto)
                    .orElseGet(() -> zeroRecommendation(atmId));
        }
        Prediction prediction = findPrediction(atmId, request.predictionId());
        BigDecimal predictedDemand = request.predictedDemand() != null
                ? request.predictedDemand() : prediction == null ? BigDecimal.ZERO : prediction.getPredictedDemand();
        ForecastFeedback feedback = request.predictedDemand() == null
            ? forecastFeedback(atmId, prediction, predictedDemand)
            : new ForecastFeedback(predictedDemand, "");
        predictedDemand = feedback.adjustedDemand();
        String historicalPerformance = feedback.note();
        BigDecimal safetyReserve = request.safetyReserve() == null
                ? properties.getDefaultSafetyReserve() : request.safetyReserve();
        BigDecimal currentCash = value(atm.getCurrentCash());
        BigDecimal capacity = value(atm.getCashCapacity());
        BigDecimal availableCapacity = capacity.subtract(currentCash).max(BigDecimal.ZERO);
        BigDecimal requiredCash = predictedDemand.add(safetyReserve);
        BigDecimal requiredRefill = requiredCash.subtract(currentCash).max(BigDecimal.ZERO);
        BigDecimal denominationUnit = BigDecimal.valueOf(50);
        BigDecimal representableCapacity = availableCapacity.divide(denominationUnit, 0, RoundingMode.DOWN)
            .multiply(denominationUnit);
        BigDecimal refill = requiredRefill.divide(denominationUnit, 0, RoundingMode.UP)
            .multiply(denominationUnit).min(representableCapacity);

        OptimizationRecommendation recommendation = new OptimizationRecommendation();
        recommendation.setAtm(atm);
        recommendation.setPrediction(prediction);
        recommendation.setCurrentCash(currentCash);
        recommendation.setPredictedDemand(predictedDemand);
        recommendation.setSafetyReserve(safetyReserve);
        recommendation.setRecommendedRefillAmount(refill);
        recommendation.setRecommendedRefillDate(request.recommendedRefillDate() == null
                ? LocalDate.now(ZoneOffset.UTC).plusDays(properties.getRefillLeadDays())
                : request.recommendedRefillDate());
        recommendation.setPriority(priority(currentCash, capacity, refill));
        recommendation.setReason(reason(currentCash, requiredCash, refill, availableCapacity) + historicalPerformance);
        recommendation.setStatus(RecommendationStatus.PENDING);
        OptimizationRecommendation saved = recommendations.save(recommendation);
        if (eventPublisher != null) {
            eventPublisher.publish(EventType.RECOMMENDATION_CREATED,
                    new RecommendationCreatedEvent(saved.getId(), atm.getId(),
                            saved.getPrediction() == null ? null : saved.getPrediction().getId(),
                            saved.getPredictedDemand(), saved.getRecommendedRefillAmount(), saved.getStatus()));
        }
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<OptimizationRecommendationDto> byAtm(Long atmId) {
        requireAtm(atmId);
        return recommendations.findByAtmId(atmId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<OptimizationRecommendationDto> list() {
        return recommendations.findAll().stream().map(this::toDto).toList();
    }

    @Transactional
    public OptimizationRecommendationDto approve(Long id) { return changeStatus(id, RecommendationStatus.APPROVED); }

    @Transactional
    public OptimizationRecommendationDto reject(Long id) { return changeStatus(id, RecommendationStatus.REJECTED); }

    private OptimizationRecommendationDto changeStatus(Long id, RecommendationStatus status) {
        OptimizationRecommendation recommendation = recommendations.findById(id)
                .orElseThrow(() -> notFound("Recommendation not found", "RECOMMENDATION_NOT_FOUND"));
        if (recommendation.getStatus() != RecommendationStatus.PENDING) {
            throw new BusinessRuleException("Only pending recommendations can be changed", "INVALID_RECOMMENDATION_STATUS");
        }
        recommendation.setStatus(status);
        OptimizationRecommendation saved = recommendations.save(recommendation);
        if (status == RecommendationStatus.APPROVED && eventPublisher != null) {
            publishAfterCommit(() -> eventPublisher.publish(EventType.RECOMMENDATION_APPROVED,
                    new RecommendationCreatedEvent(saved.getId(), saved.getAtm().getId(),
                            saved.getPrediction() == null ? null : saved.getPrediction().getId(),
                            saved.getPredictedDemand(), saved.getRecommendedRefillAmount(), saved.getStatus())));
        }
        return toDto(saved);
    }

    private void publishAfterCommit(Runnable publish) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            publish.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() { publish.run(); }
        });
    }

    private Prediction findPrediction(Long atmId, Long predictionId) {
        if (predictionId == null) return predictions.findFirstByAtmIdOrderByPredictionDateDescGeneratedAtDesc(atmId).orElse(null);
        Prediction prediction = predictions.findById(predictionId)
                .orElseThrow(() -> notFound("Prediction not found", "PREDICTION_NOT_FOUND"));
        if (prediction.getAtm() == null || !atmId.equals(prediction.getAtm().getId())) {
            throw new BusinessRuleException("Prediction does not belong to ATM", "PREDICTION_ATM_MISMATCH");
        }
        return prediction;
    }

    private void requireAtm(Long atmId) {
        if (!atms.existsById(atmId)) throw notFound("ATM not found", "ATM_NOT_FOUND");
    }

    private RecommendationPriority priority(BigDecimal currentCash, BigDecimal capacity, BigDecimal refill) {
        if (currentCash.signum() == 0 || capacity.signum() == 0
                || refill.compareTo(capacity.subtract(currentCash).max(BigDecimal.ZERO)) >= 0) {
            return RecommendationPriority.CRITICAL;
        }
        BigDecimal ratio = refill.divide(capacity, 6, RoundingMode.HALF_UP);
        if (ratio.compareTo(properties.getCriticalRefillRatio()) >= 0) return RecommendationPriority.CRITICAL;
        if (ratio.compareTo(properties.getHighRefillRatio()) >= 0) return RecommendationPriority.HIGH;
        if (ratio.compareTo(properties.getMediumRefillRatio()) >= 0) return RecommendationPriority.MEDIUM;
        return RecommendationPriority.LOW;
    }

    private OptimizationRecommendationDto zeroRecommendation(Long atmId) {
        return new OptimizationRecommendationDto(null, atmId, null, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.now(ZoneOffset.UTC), RecommendationPriority.LOW,
                "Duplicate recommendation skipped for the same prediction.", RecommendationStatus.PENDING,
                java.time.Instant.now(), java.time.Instant.now());
    }

    private String reason(BigDecimal currentCash, BigDecimal requiredCash, BigDecimal refill, BigDecimal availableCapacity) {
        if (refill.compareTo(requiredCash.subtract(currentCash).max(BigDecimal.ZERO)) < 0) {
            return "Demand plus safety reserve exceeds available ATM capacity; refill capped at remaining capacity.";
        }
        if (refill.signum() == 0) return "Current cash covers predicted demand and safety reserve; no refill is required.";
        return "Refill to cover predicted demand and safety reserve while respecting ATM capacity.";
    }

    private ForecastFeedback forecastFeedback(Long atmId, Prediction prediction, BigDecimal demand) {
        if (prediction == null || evaluations == null) return new ForecastFeedback(demand, "");
        PredictionEvaluation evaluation = evaluations
            .findFirstByAtmIdAndModelVersionAndPredictionDateLessThanEqualOrderByPredictionDateDescEvaluatedAtDesc(
                atmId, prediction.getModelVersion(), prediction.getPredictionDate())
            .orElse(null);
        if (evaluation == null || evaluation.getPredictedDemand().signum() == 0) {
            return new ForecastFeedback(demand, "");
        }
        BigDecimal ratio = evaluation.getActualDemand()
                .divide(evaluation.getPredictedDemand(), 4, RoundingMode.HALF_UP)
                .max(new BigDecimal("0.5000")).min(new BigDecimal("2.0000"));
        BigDecimal adjustedDemand = demand.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
        return new ForecastFeedback(adjustedDemand, performanceSummary(evaluation, ratio));
    }

    private String performanceSummary(PredictionEvaluation evaluation, BigDecimal ratio) {
        return " Historical prediction performance: actual demand=" + evaluation.getActualDemand() +
                ", absolute error=" + evaluation.getAbsoluteError() +
                ", percentage error=" + evaluation.getPercentageError() +
                "; next forecast adjusted by factor " + ratio + ".";
    }

    private record ForecastFeedback(BigDecimal adjustedDemand, String note) { }

    private BigDecimal value(BigDecimal amount) { return amount == null ? BigDecimal.ZERO : amount; }
    private ResourceNotFoundException notFound(String message, String code) { return new ResourceNotFoundException(message, code); }
    private OptimizationRecommendationDto toDto(OptimizationRecommendation recommendation) {
        return new OptimizationRecommendationDto(recommendation.getId(), recommendation.getAtm().getId(),
                recommendation.getPrediction() == null ? null : recommendation.getPrediction().getId(),
                recommendation.getCurrentCash(), recommendation.getPredictedDemand(), recommendation.getSafetyReserve(),
                recommendation.getRecommendedRefillAmount(), recommendation.getRecommendedRefillDate(), recommendation.getPriority(),
                recommendation.getReason(), recommendation.getStatus(), recommendation.getCreatedAt(), recommendation.getUpdatedAt());
    }
}
