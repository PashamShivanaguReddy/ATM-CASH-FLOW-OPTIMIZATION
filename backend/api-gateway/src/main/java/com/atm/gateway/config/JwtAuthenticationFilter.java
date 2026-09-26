package com.atm.gateway.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {
    private final SecretKey key;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtAuthenticationFilter(@Value("${jwt.secret}") String secret) {
        if (secret.length() < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
        }
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (isPublic(path, exchange.getRequest().getMethod().name())) {
            return chain.filter(exchange);
        }

        String authorization = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return unauthorized(exchange, "Authentication is required");
        }

        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(authorization.substring(7));
            return chain.filter(exchange);
        } catch (RuntimeException exception) {
            return unauthorized(exchange, "Invalid or expired token");
        }
    }

    private boolean isPublic(String path, String method) {
        return "OPTIONS".equals(method)
                || pathMatcher.match("/api/auth/**", path)
                || "/api/v1/status".equals(path)
                || path.startsWith("/actuator/")
                || "/".equals(path)
                || "/swagger-ui.html".equals(path)
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/webjars/")
                || path.startsWith("/swagger-resources/");
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"" + message + "\"}")
                .getBytes(StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
    }

    @Override
    public int getOrder() {
        return -90;
    }
}