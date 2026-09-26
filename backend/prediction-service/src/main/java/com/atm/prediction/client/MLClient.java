package com.atm.prediction.client;

import com.atm.prediction.dto.MLPredictionRequest;
import com.atm.prediction.dto.MLPredictionResponse;
import com.atm.prediction.exception.InvalidPredictionException;
import com.atm.prediction.exception.MLServiceException;
import org.springframework.http.HttpStatusCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class MLClient {
    private final RestClient client;
    private final int maxAttempts;

    @Autowired
    public MLClient(RestClient mlRestClient) {
        this(mlRestClient, 2);
    }

    MLClient(RestClient mlRestClient, int maxAttempts) {
        this.client = mlRestClient;
        this.maxAttempts = maxAttempts;
    }

    public MLPredictionResponse predict(MLPredictionRequest request) {
        RestClientException lastFailure = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                MLPredictionResponse response = client.post().uri("/predict").body(request).retrieve()
                    .onStatus(HttpStatusCode::isError, (responseMessage, responseBody) -> {
                        throw new MLServiceException("ML service returned an error", "ML_SERVICE_UNAVAILABLE", null);
                    }).body(MLPredictionResponse.class);
                validate(response, request);
                return response;
            } catch (MLServiceException | InvalidPredictionException exception) {
                throw exception;
            } catch (ResourceAccessException exception) {
                lastFailure = exception;
                if (attempt == maxAttempts) {
                    throw new MLServiceException("ML service timed out or is unavailable", "ML_SERVICE_UNAVAILABLE", exception);
                }
            } catch (RestClientException exception) {
                lastFailure = exception;
                if (attempt == maxAttempts) {
                    throw new MLServiceException("ML service is unavailable", "ML_SERVICE_UNAVAILABLE", exception);
                }
            }
        }
        throw new MLServiceException("ML service is unavailable", "ML_SERVICE_UNAVAILABLE", lastFailure);
    }

    private void validate(MLPredictionResponse response, MLPredictionRequest request) {
        if (response == null || response.atmId() == null || !request.atmId().equals(response.atmId())
                || response.predictionDate() == null || !request.predictionDate().equals(response.predictionDate())
                || response.predictedDemand() == null || response.predictedDemand().signum() < 0
                || response.confidenceScore() == null || response.confidenceScore().signum() < 0
                || response.confidenceScore().compareTo(java.math.BigDecimal.ONE) > 0
                || response.modelVersion() == null || response.modelVersion().isBlank()
                || response.modelVersion().length() > 64) {
            throw new InvalidPredictionException("ML service returned an invalid prediction");
        }
    }
}
