package com.atm.domain.repository;
import com.atm.domain.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
public interface PredictionRepository extends JpaRepository<Prediction, Long> {
	List<Prediction> findByAtmIdAndPredictionDateBetweenOrderByPredictionDateAsc(Long atmId, LocalDate from, LocalDate to);
	List<Prediction> findByPredictionDate(LocalDate predictionDate);
	Optional<Prediction> findFirstByAtmIdOrderByPredictionDateDescGeneratedAtDesc(Long atmId);
}
