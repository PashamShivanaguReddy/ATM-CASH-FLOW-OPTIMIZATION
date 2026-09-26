package com.atm.prediction.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class MLClientConfig {
    @Bean
    RestClient mlRestClient(@Value("${ml.service.url:http://localhost:8000}") String baseUrl,
                            @Value("${ml.service.connect-timeout-ms:1000}") int connectTimeoutMs,
                            @Value("${ml.service.read-timeout-ms:3000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        return RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }
}
