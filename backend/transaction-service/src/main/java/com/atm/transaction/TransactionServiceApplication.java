package com.atm.transaction;

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
public class TransactionServiceApplication {
    public static void main(String[] args) { SpringApplication.run(TransactionServiceApplication.class, args); }
}