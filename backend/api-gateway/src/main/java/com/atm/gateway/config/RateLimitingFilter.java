package com.atm.gateway.config;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RateLimitingFilter implements GlobalFilter, Ordered {
    private final int requestsPerMinute;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitingFilter(@Value("${gateway.rate-limit.requests-per-minute:120}") int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!exchange.getRequest().getPath().value().startsWith("/api/")) {
            return chain.filter(exchange);
        }
        String client = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (client == null || client.isBlank()) {
            client = exchange.getRequest().getRemoteAddress() == null
                    ? "unknown" : exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }
        Window window = windows.computeIfAbsent(client, ignored -> new Window());
        if (!window.allow(requestsPerMinute)) {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().set("Retry-After", "60");
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -80;
    }

    private static final class Window {
        private final AtomicInteger count = new AtomicInteger();
        private volatile long startedAt = Instant.now().getEpochSecond();

        synchronized boolean allow(int limit) {
            long now = Instant.now().getEpochSecond();
            if (now - startedAt >= 60) {
                startedAt = now;
                count.set(0);
            }
            return count.incrementAndGet() <= limit;
        }
    }
}