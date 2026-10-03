package com.atm.domain.repository;
import com.atm.domain.entity.OptimizationRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface OptimizationRecommendationRepository extends JpaRepository<OptimizationRecommendation, Long> {
    List<OptimizationRecommendation> findByAtmId(Long atmId);
    boolean existsByPredictionId(Long predictionId);
    Optional<OptimizationRecommendation> findByPredictionId(Long predictionId);
}
