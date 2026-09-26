package com.atm.analytics.repository;

import com.atm.domain.entity.Prediction;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DashboardPredictionRepository extends JpaRepository<Prediction, Long> {
    @Query("select p from Prediction p where (:bankId is null or p.atm.bank.id = :bankId) and (:atmId is null or p.atm.id = :atmId) and p.predictionDate between :from and :to")
    Page<Prediction> search(@Param("bankId") Long bankId, @Param("atmId") Long atmId, @Param("from") LocalDate from, @Param("to") LocalDate to, Pageable pageable);

    @Query("select coalesce(sum(p.predictedDemand), 0) from Prediction p where (:bankId is null or p.atm.bank.id = :bankId) and (:atmId is null or p.atm.id = :atmId) and p.predictionDate between :from and :to")
    java.math.BigDecimal sumDemand(@Param("bankId") Long bankId, @Param("atmId") Long atmId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
