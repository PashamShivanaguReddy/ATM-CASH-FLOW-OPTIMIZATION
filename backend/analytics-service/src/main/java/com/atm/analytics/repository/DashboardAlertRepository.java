package com.atm.analytics.repository;

import com.atm.domain.entity.Alert;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DashboardAlertRepository extends JpaRepository<Alert, Long> {
    @Query("select a from Alert a where (:bankId is null or a.atm.bank.id = :bankId) and (:atmId is null or a.atm.id = :atmId) and (:from is null or a.createdAt >= :from) and (:to is null or a.createdAt < :to) and (:status is null or a.status = :status)")
    Page<Alert> search(@Param("bankId") Long bankId, @Param("atmId") Long atmId, @Param("from") Instant from, @Param("to") Instant to, @Param("status") String status, Pageable pageable);

    @Query("select count(a) from Alert a where a.status in ('OPEN', 'NEW') and (:bankId is null or a.atm.bank.id = :bankId)")
    long countOpen(@Param("bankId") Long bankId);
}
