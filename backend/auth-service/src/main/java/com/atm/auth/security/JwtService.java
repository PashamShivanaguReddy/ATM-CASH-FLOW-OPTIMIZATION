package com.atm.auth.security;

import com.atm.domain.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;
    public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration-ms}") long expirationMs) {
        if (secret.length() < 32) throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.expirationMs = expirationMs;
    }
    public String generate(User user) {
        Instant now = Instant.now();
        return Jwts.builder().subject(user.getEmail()).claim("userId", user.getId()).claim("email", user.getEmail())
                .claim("role", user.getRole().name()).claim("bankId", user.getBank() == null ? null : user.getBank().getId())
                .issuedAt(Date.from(now)).expiration(Date.from(now.plusMillis(expirationMs))).signWith(key).compact();
    }
    public Claims parse(String token) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); }
    public long getExpirationSeconds() { return expirationMs / 1000; }
}
