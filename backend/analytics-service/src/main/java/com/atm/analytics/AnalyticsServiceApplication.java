package com.atm.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import com.atm.common.exception.GlobalExceptionHandler;

@SpringBootApplication
@EntityScan("com.atm.domain.entity")
@Import(GlobalExceptionHandler.class)
public class AnalyticsServiceApplication {
    public static void main(String[] args) { SpringApplication.run(AnalyticsServiceApplication.class, args); }
}