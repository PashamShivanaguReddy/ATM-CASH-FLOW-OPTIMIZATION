package com.atm.auth.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiPublicUrlConfig {

    @Bean
    public OpenAPI openAPI(@Value("${app.public-base-url:http://localhost:8080}") String publicBaseUrl) {
        return new OpenAPI()
                .servers(List.of(new Server().url(publicBaseUrl).description("Public gateway URL")));
    }
}