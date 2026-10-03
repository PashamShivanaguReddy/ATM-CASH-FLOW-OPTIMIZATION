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
public class CashUpdatedInventoryConsumer {
    private final ObjectMapper objectMapper;
    private final CashInventoryService cashInventory;
    private final ProcessedEventRepository processedEvents;

    public CashUpdatedInventoryConsumer(ObjectMapper objectMapper, CashInventoryService cashInventory,
                                        ProcessedEventRepository processedEvents) {
        this.objectMapper = objectMapper;
        this.cashInventory = cashInventory;
        this.processedEvents = processedEvents;
    }

    @Transactional
    @KafkaListener(topics = KafkaTopics.CASH_UPDATED, groupId = "cash-inventory-cash-update-service")
    public void consume(String message) throws Exception {
        AtmEvent event = objectMapper.readValue(message, AtmEvent.class);
        if (processedEvents.existsById(event.eventId())) return;
        long atmId = event.payload().path("atmId").asLong(0L);
        if (atmId <= 0L) throw new IllegalArgumentException("Cash update event is missing atmId");
        cashInventory.reconcileInventoryToAtmCash(atmId);
        processedEvents.save(new ProcessedEvent(event.eventId(), event.eventType().name()));
    }
}
