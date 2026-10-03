package com.atm.transaction.event;

import com.atm.common.event.EventType;
import com.atm.common.event.KafkaEventPublisher;
import com.atm.common.event.TransactionCreatedEvent;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.stereotype.Component;

@Component
public class TransactionKafkaBridge {
    private final KafkaEventPublisher publisher;

    public TransactionKafkaBridge(KafkaEventPublisher publisher) {
        this.publisher = publisher;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(TransactionEvent event) {
        EventType type = EventType.valueOf(event.eventType());
        publisher.publish(type, new TransactionCreatedEvent(event.transactionId(), event.atmId(),
            event.transactionType().name(), event.amount(), event.currentCash()));
    }
}