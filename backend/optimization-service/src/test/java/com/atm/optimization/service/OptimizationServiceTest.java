package com.atm.optimization.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.atm.domain.entity.ATM;
import com.atm.domain.entity.Prediction;
import com.atm.domain.entity.PredictionEvaluation;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.OptimizationRecommendationRepository;
import com.atm.domain.repository.PredictionEvaluationRepository;
import com.atm.domain.repository.PredictionRepository;
import com.atm.optimization.config.OptimizationProperties;
import com.atm.optimization.dto.RecommendationRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OptimizationServiceTest {
    @Mock private ATMRepository atms;
    @Mock private PredictionRepository predictions;
    @Mock private OptimizationRecommendationRepository recommendations;
    @Mock private PredictionEvaluationRepository evaluations;

    private OptimizationService service;
    private ATM atm;

    @BeforeEach
    void setUp() {
        OptimizationProperties properties = new OptimizationProperties();
        service = new OptimizationService(atms, predictions, recommendations, properties);
        atm = new ATM();
        atm.setId(7L);
        atm.setCurrentCash(money(40000));
        atm.setCashCapacity(money(100000));
        when(atms.findByIdForUpdate(7L)).thenReturn(Optional.of(atm));
        lenient().when(recommendations.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void recommendsNormalDemand() {
        var result = recommend(85000, 15000);
        assertEquals(money(60000), result.recommendedRefillAmount());
    }

    @Test
    void capsHighDemandAtCapacity() {
        var result = recommend(150000, 20000);
        assertEquals(money(60000), result.recommendedRefillAmount());
    }

    @Test
    void calculatesLowCashRefill() {
        atm.setCurrentCash(money(10000));
        var result = recommend(20000, 5000);
        assertEquals(money(15000), result.recommendedRefillAmount());
    }

    @Test
    void returnsNoRefillWhenCashCoversDemand() {
        var result = recommend(10000, 5000);
        assertEquals(BigDecimal.ZERO, result.recommendedRefillAmount());
    }

    @Test
    void treatsZeroCashAsCritical() {
        atm.setCurrentCash(BigDecimal.ZERO);
        var result = recommend(10000, 5000);
        assertEquals(money(15000), result.recommendedRefillAmount());
        assertEquals("CRITICAL", result.priority().name());
    }

    @Test
    void capsExcessivePredictedDemand() {
        atm.setCurrentCash(money(95000));
        var result = recommend(1000000, 0);
        assertEquals(money(5000), result.recommendedRefillAmount());
        assertEquals("CRITICAL", result.priority().name());
    }

    @Test
    void usesLatestAtmPredictionWhenNoPredictionIdOrDemandIsProvided() {
        Prediction prediction = new Prediction();
        prediction.setAtm(atm);
        prediction.setPredictedDemand(money(85000));
        when(predictions.findFirstByAtmIdOrderByPredictionDateDescGeneratedAtDesc(7L)).thenReturn(Optional.of(prediction));

        var result = service.recommend(7L, new RecommendationRequest(null, null, money(15000), null));

        assertEquals(money(85000), result.predictedDemand());
        assertEquals(money(60000), result.recommendedRefillAmount());
    }

    @Test
    void skipsDuplicateRecommendationForSamePrediction() {
        when(recommendations.existsByPredictionId(9L)).thenReturn(true);

        var result = service.recommend(7L, new RecommendationRequest(9L, null, money(15000), null));

        assertEquals(BigDecimal.ZERO, result.recommendedRefillAmount());
    }

    @Test
    void appliesPersistedSameModelAccuracyToTheNextRecommendation() {
        Prediction prediction = new Prediction();
        prediction.setId(12L);
        prediction.setAtm(atm);
        prediction.setPredictedDemand(money(20000));
        prediction.setModelVersion("v1");
        prediction.setPredictionDate(LocalDate.of(2026, 9, 16));
        atm.setCurrentCash(money(10000));
        when(predictions.findById(12L)).thenReturn(Optional.of(prediction));

        PredictionEvaluation evaluation = new PredictionEvaluation();
        evaluation.setActualDemand(money(30000));
        evaluation.setPredictedDemand(money(20000));
        evaluation.setModelVersion("v1");
        when(evaluations.findFirstByAtmIdAndModelVersionAndPredictionDateLessThanEqualOrderByPredictionDateDescEvaluatedAtDesc(
            eq(7L), eq("v1"), any())).thenReturn(Optional.of(evaluation));
        OptimizationService feedbackService = new OptimizationService(atms, predictions, recommendations,
                evaluations, new OptimizationProperties());

        var result = feedbackService.recommend(7L, new RecommendationRequest(12L, null, BigDecimal.ZERO, null));

        org.assertj.core.api.Assertions.assertThat(result.predictedDemand()).isEqualByComparingTo(money(30000));
        org.assertj.core.api.Assertions.assertThat(result.recommendedRefillAmount()).isEqualByComparingTo(money(20000));
        org.assertj.core.api.Assertions.assertThat(result.reason()).contains("adjusted by factor 1.5000");
    }

    @Test
    void roundsRefillRecommendationUpToSupportedDenomination() {
        atm.setCurrentCash(money(10000));

        var result = recommend(15025, 0);

        org.assertj.core.api.Assertions.assertThat(result.recommendedRefillAmount()).isEqualByComparingTo(money(5050));
    }

    private com.atm.domain.dto.OptimizationRecommendationDto recommend(long demand, long reserve) {
        return service.recommend(7L, new RecommendationRequest(null, money(demand), money(reserve), null));
    }

    private BigDecimal money(long amount) { return BigDecimal.valueOf(amount); }
}
