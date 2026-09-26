package com.atm.gateway.config;

import java.nio.charset.StandardCharsets;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Order(-2)
public class GatewayErrorHandler implements ErrorWebExceptionHandler {
    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable exception) {
        if (exchange.getResponse().isCommitted()) {
            return Mono.error(exception);
        }
        exchange.getResponse().setStatusCode(HttpStatus.BAD_GATEWAY);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String correlationId = exchange.getResponse().getHeaders().getFirst(RequestObservabilityFilter.CORRELATION_ID);
        String body = "{\"status\":502,\"error\":\"Bad Gateway\",\"message\":\"Upstream service unavailable\""
                + (correlationId == null ? "" : ",\"correlationId\":\"" + correlationId + "\"") + "}";
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8))));
    }
}