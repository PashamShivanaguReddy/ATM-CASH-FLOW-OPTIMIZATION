package com.atm.common.event;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record AtmEvent(String eventId, EventType eventType, Instant occurredAt, String source, JsonNode payload) {
    public static AtmEvent of(EventType eventType, String source, JsonNode payload) {
        return new AtmEvent(UUID.randomUUID().toString(), eventType, Instant.now(), source, payload);
    }
}