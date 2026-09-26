package com.atm.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

@SpringBootTest(
        classes = ApiGatewayApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "jwt.secret=a-strong-test-secret-with-at-least-32-chars",
                "services.auth.url=http://auth.test:8081",
                "services.user.url=http://user.test:8082",
                "services.bank.url=http://bank.test:8083",
                "services.atm.url=http://atm.test:8084",
                "services.transaction.url=http://transaction.test:8085",
                "services.cash-inventory.url=http://inventory.test:8086",
                "services.prediction.url=http://prediction.test:8087",
                "services.alert.url=http://alert.test:8088",
                "services.optimization.url=http://optimization.test:8089",
                "services.analytics.url=http://analytics.test:8092"
        })
class GatewayRoutesTest {
    @Autowired
    private RouteLocator routeLocator;

    @Test
    void exposesEveryFrontendRouteWithConfiguredUpstream() {
        Map<String, String> routes = routeLocator.getRoutes().collectList().block().stream()
                .collect(Collectors.toMap(Route::getId, route -> route.getUri().toString()));

        assertThat(routes).containsExactlyInAnyOrderEntriesOf(Map.ofEntries(
            Map.entry("gateway-root", "http://auth.test:8081"),
            Map.entry("swagger-docs", "http://auth.test:8081"),
            Map.entry("auth-service", "http://auth.test:8081"),
            Map.entry("user-service", "http://user.test:8082"),
            Map.entry("bank-service", "http://bank.test:8083"),
            Map.entry("atm-service", "http://atm.test:8084"),
            Map.entry("transaction-service", "http://transaction.test:8085"),
            Map.entry("cash-inventory-atm", "http://inventory.test:8086"),
            Map.entry("cash-inventory-refills", "http://inventory.test:8086"),
            Map.entry("prediction-service", "http://prediction.test:8087"),
            Map.entry("alert-service", "http://alert.test:8088"),
            Map.entry("optimization-service", "http://optimization.test:8089"),
            Map.entry("analytics-service", "http://analytics.test:8092")));
    }

    @Test
    void matchesEachFrontendPathToTheExpectedRoute() {
        assertMatches("/api/auth/login", "auth-service");
        assertMatches("/api/users/1", "user-service");
        assertMatches("/api/banks/1", "bank-service");
        assertMatches("/api/atms/1", "atm-service");
        assertMatches("/api/transactions/1", "transaction-service");
        assertMatches("/api/atms/1/cash", "cash-inventory-atm");
        assertMatches("/api/refills", "cash-inventory-refills");
        assertMatches("/api/predictions/1", "prediction-service");
        assertMatches("/api/alerts/1", "alert-service");
        assertMatches("/api/optimization/atms/1", "optimization-service");
        assertMatches("/api/dashboard/summary", "analytics-service");
        assertMatches("/swagger-ui.html", "swagger-docs");
        assertMatches("/swagger-ui/index.html", "swagger-docs");
        assertMatches("/v3/api-docs", "swagger-docs");
    }

    private void assertMatches(String path, String routeId) {
        Route route = routeLocator.getRoutes().filter(candidate -> candidate.getId().equals(routeId)).next().block();
        assertThat(route).isNotNull();
        boolean matches = Mono.from(route.getPredicate().apply(
            MockServerWebExchange.from(MockServerHttpRequest.get(path).build()))).block();
        assertThat(matches).as(path).isTrue();
    }
}