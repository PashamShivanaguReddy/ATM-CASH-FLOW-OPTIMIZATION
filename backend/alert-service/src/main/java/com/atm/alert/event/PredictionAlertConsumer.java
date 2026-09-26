package com.atm.alert.event;

import com.atm.alert.dto.AlertEvaluationRequest;
import com.atm.alert.service.AlertService;
import com.atm.common.event.AtmEvent;
import com.atm.common.event.KafkaTopics;
import com.atm.domain.entity.ProcessedEvent;
import com.atm.domain.repository.ProcessedEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PredictionAlertConsumer {
    private final ObjectMapper objectMapper;
    private final AlertService alertService;
    private final ProcessedEventRepository processedEvents;

    public PredictionAlertConsumer(ObjectMapper objectMapper, AlertService alertService,
                                   ProcessedEventRepository processedEvents) {
        this.objectMapper = objectMapper;
        this.alertService = alertService;
        this.processedEvents = processedEvents;
    }

    @Transactional
    @KafkaListener(topics = KafkaTopics.PREDICTION_GENERATED, groupId = "alert-service")
    public void consume(String message) throws Exception {
        AtmEvent event = objectMapper.readValue(message, AtmEvent.class);
        if (processedEvents.existsById(event.eventId())) return;
        Long atmId = event.payload().path("atmId").asLong();
        BigDecimal demand = event.payload().path("predictedDemand").decimalValue();
        alertService.evaluate(new AlertEvaluationRequest(atmId, demand));
        processedEvents.save(new ProcessedEvent(event.eventId(), event.eventType().name()));
    }
}