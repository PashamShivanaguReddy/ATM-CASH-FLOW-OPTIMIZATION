package com.atm.common.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaEventPublisher {
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper objectMapper;
    private final String source;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafka, ObjectMapper objectMapper,
                               @Value("${spring.application.name}") String source) {
        this.kafka = kafka;
        this.objectMapper = objectMapper;
        this.source = source;
    }

    public void publish(EventType type, Object payload) {
        try {
            AtmEvent event = AtmEvent.of(type, source, objectMapper.valueToTree(payload));
            kafka.send(KafkaEventPublisher.topic(type), event.eventId(), objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize event " + type, exception);
        }
    }

    public static String topic(EventType type) {
        return switch (type) {
            case ATM_CREATED -> KafkaTopics.ATM_CREATED;
            case ATM_UPDATED -> KafkaTopics.ATM_UPDATED;
            case TRANSACTION_CREATED -> KafkaTopics.TRANSACTION_CREATED;
            case CASH_UPDATED -> KafkaTopics.CASH_UPDATED;
            case REFILL_REQUESTED -> KafkaTopics.REFILL_REQUESTED;
            case REFILL_COMPLETED -> KafkaTopics.REFILL_COMPLETED;
            case PREDICTION_GENERATED -> KafkaTopics.PREDICTION_GENERATED;
            case LOW_CASH_DETECTED -> KafkaTopics.LOW_CASH_DETECTED;
            case STOCKOUT_RISK_DETECTED -> KafkaTopics.STOCKOUT_RISK_DETECTED;
            case ALERT_GENERATED -> KafkaTopics.ALERT_GENERATED;
            case RECOMMENDATION_CREATED -> KafkaTopics.RECOMMENDATION_CREATED;
            case RECOMMENDATION_APPROVED -> KafkaTopics.RECOMMENDATION_APPROVED;
        };
    }
}