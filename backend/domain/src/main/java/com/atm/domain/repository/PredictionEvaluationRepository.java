package com.atm.domain.repository;

import com.atm.domain.entity.PredictionEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface PredictionEvaluationRepository extends JpaRepository<PredictionEvaluation, Long> {
    Optional<PredictionEvaluation> findByPredictionId(Long predictionId);
    Optional<PredictionEvaluation> findFirstByAtmIdAndModelVersionAndPredictionDateLessThanEqualOrderByPredictionDateDescEvaluatedAtDesc(
            Long atmId, String modelVersion, LocalDate predictionDate);
    boolean existsByPredictionId(Long predictionId);
}
