package com.atm.prediction.service;

import com.atm.domain.entity.Prediction;
import com.atm.domain.repository.PredictionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;

@Component
public class PredictionEvaluationScheduler {
    private static final Logger log = LoggerFactory.getLogger(PredictionEvaluationScheduler.class);

    private final PredictionRepository predictions;
    private final PredictionEvaluationService evaluations;

    public PredictionEvaluationScheduler(PredictionRepository predictions, PredictionEvaluationService evaluations) {
        this.predictions = predictions;
        this.evaluations = evaluations;
    }

    @Scheduled(cron = "0 15 0 * * *", zone = "UTC")
    public void evaluatePreviousDay() {
        LocalDate completedDate = LocalDate.now(ZoneOffset.UTC).minusDays(1);
        for (Prediction prediction : predictions.findByPredictionDate(completedDate)) {
            try {
                evaluations.evaluatePrediction(prediction.getId());
            } catch (RuntimeException exception) {
                log.error("Prediction evaluation failed for predictionId={}", prediction.getId(), exception);
            }
        }
    }
}
