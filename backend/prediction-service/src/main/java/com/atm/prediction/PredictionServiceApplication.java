package com.atm.prediction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import com.atm.common.exception.GlobalExceptionHandler;
import com.atm.common.event.KafkaConfiguration;
import com.atm.common.event.KafkaEventPublisher;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@Import({GlobalExceptionHandler.class, KafkaConfiguration.class, KafkaEventPublisher.class})
@EntityScan("com.atm.domain.entity")
@EnableJpaRepositories("com.atm.domain.repository")
public class PredictionServiceApplication {
    public static void main(String[] args) { SpringApplication.run(PredictionServiceApplication.class, args); }
}