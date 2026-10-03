package com.atm.domain.repository;
import com.atm.domain.entity.ATMTransaction;
import com.atm.domain.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ATMTransactionRepository extends JpaRepository<ATMTransaction, Long>, JpaSpecificationExecutor<ATMTransaction> {
    Optional<ATMTransaction> findByTransactionId(String transactionId);

    Page<ATMTransaction> findByAtmId(Long atmId, Pageable pageable);
    List<ATMTransaction> findByAtmIdAndTimestampBetween(Long atmId, Instant from, Instant to);
    long countByAtmId(Long atmId);

    @Query("select coalesce(sum(t.amount), 0) from ATMTransaction t where t.atm.id = :atmId and t.transactionType = :type and t.success = true and t.timestamp between :from and :to")
    BigDecimal sumSuccessfulAmount(@Param("atmId") Long atmId, @Param("type") TransactionType type,
				   @Param("from") Instant from, @Param("to") Instant to);

    @Query("select count(t) from ATMTransaction t where t.atm.id = :atmId and t.success = true and t.timestamp between :from and :to")
    long countSuccessful(@Param("atmId") Long atmId, @Param("from") Instant from, @Param("to") Instant to);

    @Query("select avg(t.amount) from ATMTransaction t where t.atm.id = :atmId and t.transactionType = :type and t.success = true and t.timestamp between :from and :to")
    BigDecimal averageSuccessfulAmount(@Param("atmId") Long atmId, @Param("type") TransactionType type,
				       @Param("from") Instant from, @Param("to") Instant to);

    @Query("select max(t.amount) from ATMTransaction t where t.atm.id = :atmId and t.transactionType = :type and t.success = true and t.timestamp between :from and :to")
    BigDecimal maximumSuccessfulAmount(@Param("atmId") Long atmId, @Param("type") TransactionType type,
				       @Param("from") Instant from, @Param("to") Instant to);
}
