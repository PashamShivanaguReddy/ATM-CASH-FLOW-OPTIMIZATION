package com.atm.analytics.repository;

import com.atm.domain.entity.ATMTransaction;
import com.atm.domain.entity.TransactionType;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DashboardTransactionRepository extends JpaRepository<ATMTransaction, Long> {
    @Query("select t from ATMTransaction t where (:bankId is null or t.atm.bank.id = :bankId) and (:atmId is null or t.atm.id = :atmId) and t.timestamp >= :from and t.timestamp < :to")
    Page<ATMTransaction> search(@Param("bankId") Long bankId, @Param("atmId") Long atmId, @Param("from") Instant from, @Param("to") Instant to, Pageable pageable);

    @Query("select count(t) from ATMTransaction t where (:bankId is null or t.atm.bank.id = :bankId) and (:atmId is null or t.atm.id = :atmId) and t.timestamp >= :from and t.timestamp < :to")
    long count(@Param("bankId") Long bankId, @Param("atmId") Long atmId, @Param("from") Instant from, @Param("to") Instant to);

    @Query("select coalesce(sum(t.amount), 0) from ATMTransaction t where (:bankId is null or t.atm.bank.id = :bankId) and (:atmId is null or t.atm.id = :atmId) and t.transactionType = :type and t.success = true and t.timestamp >= :from and t.timestamp < :to")
    BigDecimal sumSuccessful(@Param("bankId") Long bankId, @Param("atmId") Long atmId, @Param("type") TransactionType type, @Param("from") Instant from, @Param("to") Instant to);
}
