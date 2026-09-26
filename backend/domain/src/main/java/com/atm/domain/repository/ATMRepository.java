package com.atm.domain.repository;
import com.atm.domain.entity.ATM;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import com.atm.domain.entity.AtmStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
public interface ATMRepository extends JpaRepository<ATM, Long> {
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select a from ATM a join fetch a.bank where a.id = :id")
	Optional<ATM> findByIdForUpdate(Long id);
	Optional<ATM> findByAtmCode(String atmCode);
	Page<ATM> findByBankId(Long bankId, Pageable pageable);
	Page<ATM> findByStatus(AtmStatus status, Pageable pageable);
	Page<ATM> findByBankIdAndStatus(Long bankId, AtmStatus status, Pageable pageable);
}
