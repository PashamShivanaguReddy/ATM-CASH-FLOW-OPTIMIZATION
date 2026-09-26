package com.atm.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

class JwtAuthenticationFilterTest {
    private static final String SECRET = "a-strong-test-secret-with-at-least-32-chars";

    @Test
    void allowsAuthEndpointWithoutToken() {
        AtomicBoolean continued = new AtomicBoolean();
        ServerWebExchange exchange = exchange("/api/auth/login", null);

        new com.atm.gateway.config.JwtAuthenticationFilter(SECRET)
                .filter(exchange, chain(continued)).block();

        assertThat(continued).isTrue();
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void rejectsProtectedEndpointWithoutToken() {
        AtomicBoolean continued = new AtomicBoolean();
        ServerWebExchange exchange = exchange("/api/atms", null);

        new com.atm.gateway.config.JwtAuthenticationFilter(SECRET)
                .filter(exchange, chain(continued)).block();

        assertThat(continued).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void forwardsProtectedEndpointWithValidToken() {
        String token = Jwts.builder().subject("user@example.com")
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact();
        AtomicBoolean continued = new AtomicBoolean();
        ServerWebExchange exchange = exchange("/api/atms", token);

        new com.atm.gateway.config.JwtAuthenticationFilter(SECRET)
                .filter(exchange, chain(continued)).block();

        assertThat(continued).isTrue();
    }

    private ServerWebExchange exchange(String path, String token) {
        MockServerHttpRequest.BaseBuilder<?> request = MockServerHttpRequest.get(path);
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return MockServerWebExchange.from(request.build());
    }

    private GatewayFilterChain chain(AtomicBoolean continued) {
        return exchange -> {
            continued.set(true);
            return Mono.empty();
        };
    }
}