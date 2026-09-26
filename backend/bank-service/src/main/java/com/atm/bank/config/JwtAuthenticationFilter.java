package com.atm.bank.config;

import com.atm.bank.service.BankPrincipal;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                var claims = jwtService.parse(header.substring(7));
                Number userId = claims.get("userId", Number.class);
                Number bankId = claims.get("bankId", Number.class);
                String role = claims.get("role", String.class);
                BankPrincipal principal = new BankPrincipal(claims.getSubject(),
                        userId == null ? null : userId.longValue(),
                        bankId == null ? null : bankId.longValue(), role);
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(principal, null, List.of(() -> "ROLE_" + role)));
            } catch (JwtException | IllegalArgumentException ignored) {
                // Leave the request unauthenticated so Spring Security rejects protected routes.
            }
        }
        chain.doFilter(request, response);
    }
}
