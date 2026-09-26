package com.atm.analytics.repository;

import com.atm.domain.entity.CashRefill;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DashboardRefillRepository extends JpaRepository<CashRefill, Long> {
    @Query("select r from CashRefill r where (:bankId is null or r.atm.bank.id = :bankId) and (:atmId is null or r.atm.id = :atmId) and (:from is null or r.refillDate >= :from) and (:to is null or r.refillDate < :to) and (:status is null or str(r.status) = :status)")
    Page<CashRefill> search(@Param("bankId") Long bankId, @Param("atmId") Long atmId, @Param("from") Instant from, @Param("to") Instant to, @Param("status") String status, Pageable pageable);

    @Query("select count(r) from CashRefill r where r.status in (com.atm.domain.entity.RefillStatus.REQUESTED, com.atm.domain.entity.RefillStatus.APPROVED) and (:bankId is null or r.atm.bank.id = :bankId)")
    long countPending(@Param("bankId") Long bankId);
}
