package com.atm.common.event;

import static org.springframework.kafka.test.utils.KafkaTestUtils.getSingleRecord;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

@EmbeddedKafka(partitions = 1, topics = KafkaTopics.TRANSACTION_CREATED)
@SpringJUnitConfig
@ContextConfiguration(classes = KafkaEventFlowIntegrationTest.TestConfiguration.class)
class KafkaEventFlowIntegrationTest {
    @Autowired
    private EmbeddedKafkaBroker broker;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void publishesAndDeserializesAnEventEnvelope() throws Exception {
        Map<String, Object> producerProperties = KafkaTestUtils.producerProps(broker);
        KafkaTemplate<String, String> template = new KafkaTemplate<>(
            new DefaultKafkaProducerFactory<>(producerProperties, new StringSerializer(), new StringSerializer()));
        AtmEvent event = AtmEvent.of(EventType.TRANSACTION_CREATED, "transaction-service",
            objectMapper.valueToTree(new TransactionCreatedEvent(20L, 10L, "WITHDRAWAL", new BigDecimal("25.00"), new BigDecimal("475.00"))));
        template.send(KafkaTopics.TRANSACTION_CREATED, event.eventId(), objectMapper.writeValueAsString(event)).get();

        Map<String, Object> consumerProperties = KafkaTestUtils.consumerProps(UUID.randomUUID().toString(), "false", broker);
        try (Consumer<String, String> consumer = new DefaultKafkaConsumerFactory<String, String>(consumerProperties,
                new StringDeserializer(), new StringDeserializer()).createConsumer()) {
            broker.consumeFromAnEmbeddedTopic(consumer, KafkaTopics.TRANSACTION_CREATED);
            AtmEvent received = objectMapper.readValue(getSingleRecord(consumer, KafkaTopics.TRANSACTION_CREATED).value(), AtmEvent.class);
            assertEquals(event.eventId(), received.eventId());
            assertEquals(10L, received.payload().path("atmId").asLong());
        }
    }

    @Configuration
    static class TestConfiguration { }
}