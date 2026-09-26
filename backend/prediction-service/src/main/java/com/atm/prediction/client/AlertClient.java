package com.atm.prediction.client;

import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

public class AlertClient {
    private static final Logger log = LoggerFactory.getLogger(AlertClient.class);
    private final RestClient client;

    public AlertClient(RestClient client) { this.client = client; }

    public void evaluate(Long atmId, BigDecimal predictedDemand) {
        try {
            client.post().uri("/api/alerts/internal/evaluate")
                .body(new AlertEvaluationRequest(atmId, predictedDemand)).retrieve().toBodilessEntity();
        } catch (RestClientException exception) {
            log.warn("Alert evaluation unavailable atmId={}: {}", atmId, exception.getMessage());
        }
    }

    private record AlertEvaluationRequest(Long atmId, BigDecimal predictedDemand) { }
}