package com.atm.inventory.event;

import com.atm.common.event.AtmEvent;
import com.atm.common.event.KafkaTopics;
import com.atm.domain.entity.ProcessedEvent;
import com.atm.domain.repository.ProcessedEventRepository;
import com.atm.inventory.service.CashInventoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RecommendationApprovalConsumer {
    private final ObjectMapper objectMapper;
    private final CashInventoryService cashInventory;
    private final ProcessedEventRepository processedEvents;

    public RecommendationApprovalConsumer(ObjectMapper objectMapper, CashInventoryService cashInventory,
                                          ProcessedEventRepository processedEvents) {
        this.objectMapper = objectMapper;
        this.cashInventory = cashInventory;
        this.processedEvents = processedEvents;
    }

    @Transactional
    @KafkaListener(topics = KafkaTopics.RECOMMENDATION_APPROVED, groupId = "cash-inventory-service")
    public void consume(String message) throws Exception {
        AtmEvent event = objectMapper.readValue(message, AtmEvent.class);
        if (processedEvents.existsById(event.eventId())) return;
        long recommendationId = event.payload().path("recommendationId").asLong(0L);
        if (recommendationId <= 0L) throw new IllegalArgumentException("Recommendation approval event is missing recommendationId");
        cashInventory.createRefillFromApprovedRecommendation(recommendationId);
        processedEvents.save(new ProcessedEvent(event.eventId(), event.eventType().name()));
    }
}
