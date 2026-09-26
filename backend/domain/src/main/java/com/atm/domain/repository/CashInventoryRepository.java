package com.atm.domain.repository;
import com.atm.domain.entity.CashInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import java.util.List;
public interface CashInventoryRepository extends JpaRepository<CashInventory, Long> {
	List<CashInventory> findByAtmId(Long atmId);
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select c from CashInventory c where c.atm.id = :atmId order by c.denomination")
	List<CashInventory> findByAtmIdForUpdate(Long atmId);
}
