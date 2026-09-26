package com.atm.gateway.config;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RequestObservabilityFilter implements GlobalFilter, Ordered {
    public static final String CORRELATION_ID = "X-Correlation-ID";
    private static final Logger LOGGER = LoggerFactory.getLogger(RequestObservabilityFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_ID);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        String requestCorrelationId = correlationId;
        ServerWebExchange enrichedExchange = exchange.mutate()
                .request(request -> request.headers(headers -> headers.set(CORRELATION_ID, requestCorrelationId)))
                .build();
        enrichedExchange.getResponse().getHeaders().set(CORRELATION_ID, requestCorrelationId);
        long startedAt = System.nanoTime();
        LOGGER.info("gateway request method={} path={} correlationId={}",
                exchange.getRequest().getMethod(), exchange.getRequest().getPath(), requestCorrelationId);
        return chain.filter(enrichedExchange)
                .doFinally(signal -> LOGGER.info("gateway response status={} correlationId={} durationMs={}",
                        enrichedExchange.getResponse().getStatusCode(), requestCorrelationId,
                        (System.nanoTime() - startedAt) / 1_000_000));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}