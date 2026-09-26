package com.atm.prediction.event;

import com.atm.common.event.AtmEvent;
import com.atm.common.event.KafkaTopics;
import com.atm.domain.entity.ProcessedEvent;
import com.atm.domain.repository.ProcessedEventRepository;
import com.atm.prediction.dto.PredictionRequest;
import com.atm.prediction.service.PredictionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TransactionPredictionConsumer {
    private final ObjectMapper objectMapper;
    private final PredictionService predictionService;
    private final ProcessedEventRepository processedEvents;

    public TransactionPredictionConsumer(ObjectMapper objectMapper, PredictionService predictionService,
                                         ProcessedEventRepository processedEvents) {
        this.objectMapper = objectMapper;
        this.predictionService = predictionService;
        this.processedEvents = processedEvents;
    }

    @Transactional
    @KafkaListener(topics = KafkaTopics.TRANSACTION_CREATED, groupId = "prediction-service")
    public void consume(String message) throws Exception {
        AtmEvent event = objectMapper.readValue(message, AtmEvent.class);
        if (processedEvents.existsById(event.eventId())) return;
        Long atmId = event.payload().path("atmId").asLong();
        predictionService.createFromEvent(atmId, new PredictionRequest(String.valueOf(atmId),
            LocalDate.now(), Map.of()));
        processedEvents.save(new ProcessedEvent(event.eventId(), event.eventType().name()));
    }
}