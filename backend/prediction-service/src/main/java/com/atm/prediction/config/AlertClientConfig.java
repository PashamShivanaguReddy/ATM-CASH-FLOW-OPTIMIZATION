package com.atm.prediction.config;

import com.atm.prediction.client.AlertClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class AlertClientConfig {
    @Bean
    AlertClient alertClient(@Value("${alert.service.url:http://localhost:8088}") String baseUrl) {
        return new AlertClient(RestClient.builder().baseUrl(baseUrl).build());
    }
}