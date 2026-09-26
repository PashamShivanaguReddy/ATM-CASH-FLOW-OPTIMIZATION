package com.atm.gateway.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutes {
    @Bean
    RouteLocator routes(
            RouteLocatorBuilder builder,
            @Value("${services.auth.url}") String authUrl,
            @Value("${services.user.url}") String userUrl,
            @Value("${services.bank.url}") String bankUrl,
            @Value("${services.atm.url}") String atmUrl,
            @Value("${services.transaction.url}") String transactionUrl,
            @Value("${services.cash-inventory.url}") String cashInventoryUrl,
            @Value("${services.prediction.url}") String predictionUrl,
            @Value("${services.alert.url}") String alertUrl,
            @Value("${services.optimization.url}") String optimizationUrl,
            @Value("${services.analytics.url}") String analyticsUrl) {
        return builder.routes()
                .route("gateway-root", route -> route.path("/")
                        .filters(filter -> filter.setPath("/swagger-ui.html"))
                        .uri(URI.create(authUrl)))
                .route("swagger-docs", route -> route.path("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/webjars/**", "/swagger-resources/**")
                        .uri(URI.create(authUrl)))
                .route("cash-inventory-atm", route -> route.path("/api/atms/*/cash/**").uri(URI.create(cashInventoryUrl)))
                .route("cash-inventory-refills", route -> route.path("/api/refills/**").uri(URI.create(cashInventoryUrl)))
                .route("auth-service", route -> route.path("/api/auth/**").uri(URI.create(authUrl)))
                .route("user-service", route -> route.path("/api/users/**").uri(URI.create(userUrl)))
                .route("bank-service", route -> route.path("/api/banks/**").uri(URI.create(bankUrl)))
                .route("atm-service", route -> route.path("/api/atms/**").uri(URI.create(atmUrl)))
                .route("transaction-service", route -> route.path("/api/transactions/**").uri(URI.create(transactionUrl)))
                .route("prediction-service", route -> route.path("/api/predictions/**").uri(URI.create(predictionUrl)))
                .route("alert-service", route -> route.path("/api/alerts/**").uri(URI.create(alertUrl)))
                .route("optimization-service", route -> route.path("/api/optimization/**").uri(URI.create(optimizationUrl)))
                .route("analytics-service", route -> route.path("/api/dashboard/**").uri(URI.create(analyticsUrl)))
                .build();
    }
}