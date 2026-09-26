package com.atm.auth.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    public JwtAuthenticationFilter(JwtService jwtService) { this.jwtService = jwtService; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                var claims = jwtService.parse(header.substring(7));
                String role = claims.get("role", String.class);
                Number userId = claims.get("userId", Number.class);
                Number bankId = claims.get("bankId", Number.class);
                var principal = new AuthenticatedUser(claims.getSubject(),
                        userId == null ? null : userId.longValue(),
                        bankId == null ? null : bankId.longValue(), role);
                var authentication = new UsernamePasswordAuthenticationToken(principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException ignored) { }
        }
        chain.doFilter(request, response);
    }
}
