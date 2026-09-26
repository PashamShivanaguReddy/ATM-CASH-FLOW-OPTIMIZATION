package com.atm.atm.config;

import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Value("${app.cors.allowed-origins:http://localhost:3000}") private String allowedOrigins;
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        return http.csrf(csrf -> csrf.disable()).cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint((request, response, ex) -> response.sendError(HttpStatus.UNAUTHORIZED.value(), "Unauthorized")))
                .authorizeHttpRequests(a -> a.requestMatchers("/api/v1/status", "/actuator/health", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**", "/webjars/**").permitAll().anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class).build();
    }
    @Bean CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration(); config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")); config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        return request -> config;
    }
}