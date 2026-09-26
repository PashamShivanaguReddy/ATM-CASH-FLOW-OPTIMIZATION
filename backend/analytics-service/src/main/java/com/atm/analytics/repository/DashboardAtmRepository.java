package com.atm.analytics.repository;

import com.atm.domain.entity.ATM;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DashboardAtmRepository extends JpaRepository<ATM, Long> {
    @Query("select a from ATM a where (:bankId is null or a.bank.id = :bankId) and (:atmId is null or a.id = :atmId)")
    Page<ATM> search(@Param("bankId") Long bankId, @Param("atmId") Long atmId, Pageable pageable);

    @Query("select count(a) from ATM a where (:bankId is null or a.bank.id = :bankId)")
    long countAll(@Param("bankId") Long bankId);

    @Query("select count(a) from ATM a where a.status = com.atm.domain.entity.AtmStatus.ACTIVE and (:bankId is null or a.bank.id = :bankId)")
    long countActive(@Param("bankId") Long bankId);

    @Query("select count(a) from ATM a where (a.status = com.atm.domain.entity.AtmStatus.LOW_CASH or a.currentCash <= a.minimumCashThreshold) and (:bankId is null or a.bank.id = :bankId)")
    long countLowCash(@Param("bankId") Long bankId);

    @Query("select count(a) from ATM a where (a.status = com.atm.domain.entity.AtmStatus.OUT_OF_SERVICE or a.currentCash = 0) and (:bankId is null or a.bank.id = :bankId)")
    long countCritical(@Param("bankId") Long bankId);

    @Query("select coalesce(sum(a.currentCash), 0) from ATM a where (:bankId is null or a.bank.id = :bankId)")
    BigDecimal sumCash(@Param("bankId") Long bankId);
}
