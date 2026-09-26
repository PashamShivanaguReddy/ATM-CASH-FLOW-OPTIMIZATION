package com.atm.transaction.event;

import com.atm.common.event.EventType;
import com.atm.common.event.KafkaEventPublisher;
import com.atm.common.event.TransactionCreatedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class TransactionKafkaBridge {
    private final KafkaEventPublisher publisher;

    public TransactionKafkaBridge(KafkaEventPublisher publisher) {
        this.publisher = publisher;
    }

    @EventListener
    public void publish(TransactionEvent event) {
        EventType type = EventType.valueOf(event.eventType());
        publisher.publish(type, new TransactionCreatedEvent(event.transactionId(), event.atmId(),
            event.transactionType().name(), event.amount(), event.currentCash()));
    }
}