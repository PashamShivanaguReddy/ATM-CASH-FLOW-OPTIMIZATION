package com.atm.alert;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import com.atm.common.exception.GlobalExceptionHandler;
import com.atm.common.event.KafkaConfiguration;
import com.atm.common.event.KafkaEventPublisher;

@SpringBootApplication
@EntityScan("com.atm.domain.entity")
@EnableJpaRepositories("com.atm.domain.repository")
@Import({GlobalExceptionHandler.class, KafkaConfiguration.class, KafkaEventPublisher.class})
public class AlertServiceApplication {
    public static void main(String[] args) { SpringApplication.run(AlertServiceApplication.class, args); }
}