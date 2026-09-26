package com.atm.domain.repository;
import com.atm.domain.entity.OptimizationRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OptimizationRecommendationRepository extends JpaRepository<OptimizationRecommendation, Long> { List<OptimizationRecommendation> findByAtmId(Long atmId); }
