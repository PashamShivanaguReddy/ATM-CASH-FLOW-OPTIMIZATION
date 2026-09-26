package com.atm.optimization.service;

import com.atm.common.exception.BusinessRuleException;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.dto.OptimizationRecommendationDto;
import com.atm.domain.entity.ATM;
import com.atm.domain.entity.OptimizationRecommendation;
import com.atm.domain.entity.Prediction;
import com.atm.domain.entity.RecommendationPriority;
import com.atm.domain.entity.RecommendationStatus;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.OptimizationRecommendationRepository;
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

@Service
public class OptimizationService {
    private final ATMRepository atms;
    private final PredictionRepository predictions;
    private final OptimizationRecommendationRepository recommendations;
    private final OptimizationProperties properties;

    public OptimizationService(ATMRepository atms, PredictionRepository predictions,
                               OptimizationRecommendationRepository recommendations,
                               OptimizationProperties properties) {
        this.atms = atms;
        this.predictions = predictions;
        this.recommendations = recommendations;
        this.properties = properties;
    }

    @Transactional
    public OptimizationRecommendationDto recommend(Long atmId, RecommendationRequest request) {
        ATM atm = atms.findByIdForUpdate(atmId).orElseThrow(() -> notFound("ATM not found", "ATM_NOT_FOUND"));
        Prediction prediction = findPrediction(atmId, request.predictionId());
        BigDecimal predictedDemand = request.predictedDemand() != null
                ? request.predictedDemand() : prediction == null ? BigDecimal.ZERO : prediction.getPredictedDemand();
        BigDecimal safetyReserve = request.safetyReserve() == null
                ? properties.getDefaultSafetyReserve() : request.safetyReserve();
        BigDecimal currentCash = value(atm.getCurrentCash());
        BigDecimal capacity = value(atm.getCashCapacity());
        BigDecimal availableCapacity = capacity.subtract(currentCash).max(BigDecimal.ZERO);
        BigDecimal requiredCash = predictedDemand.add(safetyReserve);
        BigDecimal refill = requiredCash.subtract(currentCash).max(BigDecimal.ZERO).min(availableCapacity);

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
        recommendation.setReason(reason(currentCash, requiredCash, refill, availableCapacity));
        recommendation.setStatus(RecommendationStatus.PENDING);
        return toDto(recommendations.save(recommendation));
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
        return toDto(recommendations.save(recommendation));
    }

    private Prediction findPrediction(Long atmId, Long predictionId) {
        if (predictionId == null) return null;
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

    private String reason(BigDecimal currentCash, BigDecimal requiredCash, BigDecimal refill, BigDecimal availableCapacity) {
        if (refill.compareTo(requiredCash.subtract(currentCash).max(BigDecimal.ZERO)) < 0) {
            return "Demand plus safety reserve exceeds available ATM capacity; refill capped at remaining capacity.";
        }
        if (refill.signum() == 0) return "Current cash covers predicted demand and safety reserve; no refill is required.";
        return "Refill to cover predicted demand and safety reserve while respecting ATM capacity.";
    }

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
