package com.atm.optimization.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.atm.domain.entity.ATM;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.OptimizationRecommendationRepository;
import com.atm.domain.repository.PredictionRepository;
import com.atm.optimization.config.OptimizationProperties;
import com.atm.optimization.dto.RecommendationRequest;
import java.math.BigDecimal;
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
        when(recommendations.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
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

    private com.atm.domain.dto.OptimizationRecommendationDto recommend(long demand, long reserve) {
        return service.recommend(7L, new RecommendationRequest(null, money(demand), money(reserve), null));
    }

    private BigDecimal money(long amount) { return BigDecimal.valueOf(amount); }
}
