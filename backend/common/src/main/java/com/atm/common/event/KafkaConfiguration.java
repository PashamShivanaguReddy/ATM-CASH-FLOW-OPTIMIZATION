package com.atm.common.event;

import java.util.Map;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConfiguration {
    @Bean
    ProducerFactory<String, String> eventProducerFactory(KafkaProperties properties) {
        Map<String, Object> settings = properties.buildProducerProperties();
        settings.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        settings.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        settings.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        return new DefaultKafkaProducerFactory<>(settings);
    }

    @Bean
    KafkaTemplate<String, String> eventKafkaTemplate(ProducerFactory<String, String> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    @Bean
    DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<String, String> kafkaTemplate) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
            (record, exception) -> new org.apache.kafka.common.TopicPartition(record.topic() + ".DLT", record.partition()));
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3L));
    }

    @Bean NewTopic transactionCreatedTopic() { return TopicBuilder.name(KafkaTopics.TRANSACTION_CREATED).partitions(3).replicas(1).build(); }
    @Bean NewTopic predictionGeneratedTopic() { return TopicBuilder.name(KafkaTopics.PREDICTION_GENERATED).partitions(3).replicas(1).build(); }
    @Bean NewTopic alertGeneratedTopic() { return TopicBuilder.name(KafkaTopics.ALERT_GENERATED).partitions(3).replicas(1).build(); }
    @Bean NewTopic atmCreatedTopic() { return topic(KafkaTopics.ATM_CREATED); }
    @Bean NewTopic atmUpdatedTopic() { return topic(KafkaTopics.ATM_UPDATED); }
    @Bean NewTopic cashUpdatedTopic() { return topic(KafkaTopics.CASH_UPDATED); }
    @Bean NewTopic refillRequestedTopic() { return topic(KafkaTopics.REFILL_REQUESTED); }
    @Bean NewTopic refillCompletedTopic() { return topic(KafkaTopics.REFILL_COMPLETED); }
    @Bean NewTopic lowCashDetectedTopic() { return topic(KafkaTopics.LOW_CASH_DETECTED); }
    @Bean NewTopic stockoutRiskDetectedTopic() { return topic(KafkaTopics.STOCKOUT_RISK_DETECTED); }
    @Bean NewTopic recommendationCreatedTopic() { return topic(KafkaTopics.RECOMMENDATION_CREATED); }

    private NewTopic topic(String name) { return TopicBuilder.name(name).partitions(3).replicas(1).build(); }
}