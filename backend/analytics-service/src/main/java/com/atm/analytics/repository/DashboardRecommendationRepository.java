package com.atm.analytics.repository;

import com.atm.domain.entity.OptimizationRecommendation;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DashboardRecommendationRepository extends JpaRepository<OptimizationRecommendation, Long> {
    @Query("select r from OptimizationRecommendation r where (:bankId is null or r.atm.bank.id = :bankId) and (:atmId is null or r.atm.id = :atmId) and (:from is null or r.recommendedRefillDate >= :from) and (:to is null or r.recommendedRefillDate <= :to) and (:status is null or str(r.status) = :status)")
    Page<OptimizationRecommendation> search(@Param("bankId") Long bankId, @Param("atmId") Long atmId, @Param("from") LocalDate from, @Param("to") LocalDate to, @Param("status") String status, Pageable pageable);

    @Query("select count(distinct r.atm.id) from OptimizationRecommendation r where r.priority in (com.atm.domain.entity.RecommendationPriority.HIGH, com.atm.domain.entity.RecommendationPriority.CRITICAL) and (:bankId is null or r.atm.bank.id = :bankId)")
    long countHighRisk(@Param("bankId") Long bankId);
}
