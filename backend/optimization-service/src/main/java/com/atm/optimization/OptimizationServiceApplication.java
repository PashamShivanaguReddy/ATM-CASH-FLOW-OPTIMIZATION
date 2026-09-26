package com.atm.optimization;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import com.atm.common.exception.GlobalExceptionHandler;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@Import(GlobalExceptionHandler.class)
@EntityScan("com.atm.domain.entity")
@EnableJpaRepositories("com.atm.domain.repository")
@ConfigurationPropertiesScan
public class OptimizationServiceApplication {
    public static void main(String[] args) { SpringApplication.run(OptimizationServiceApplication.class, args); }
}