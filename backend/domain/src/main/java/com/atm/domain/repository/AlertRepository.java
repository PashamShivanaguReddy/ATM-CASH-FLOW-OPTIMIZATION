package com.atm.domain.repository;
import com.atm.domain.entity.Alert;
import com.atm.domain.entity.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface AlertRepository extends JpaRepository<Alert, Long> {
	List<Alert> findByStatusOrderByCreatedAtDesc(String status);
	List<Alert> findByAtmIdOrderByCreatedAtDesc(Long atmId);
	Optional<Alert> findFirstByAtmIdAndAlertTypeAndStatusIn(Long atmId, AlertType alertType, List<String> statuses);
}
