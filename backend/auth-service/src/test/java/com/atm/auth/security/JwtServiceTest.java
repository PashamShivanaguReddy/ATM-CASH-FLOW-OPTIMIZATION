package com.atm.auth.security;

import com.atm.domain.entity.User;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private static final String SECRET = "a-strong-test-secret-with-at-least-32-chars";
    @Test void generatesClaimsAndRejectsExpiredToken() {
        var user = new User(); user.setId(7L); user.setEmail("admin@example.com"); user.setRole(com.atm.domain.entity.UserRole.BANK_ADMIN);
        var service = new JwtService(SECRET, -1);
        String token = service.generate(user);
        assertThrows(JwtException.class, () -> service.parse(token));
    }
    @Test void rejectsInvalidToken() {
        var service = new JwtService(SECRET, 3600000);
        assertThrows(JwtException.class, () -> service.parse("not-a-jwt"));
    }
    @Test void includesNonSensitiveIdentityClaims() {
        var user = new User(); user.setId(7L); user.setEmail("admin@example.com"); user.setRole(com.atm.domain.entity.UserRole.BANK_ADMIN);
        var claims = new JwtService(SECRET, 3600000).parse(new JwtService(SECRET, 3600000).generate(user));
        assertEquals(7L, ((Number) claims.get("userId")).longValue());
        assertEquals("admin@example.com", claims.get("email"));
        assertEquals("BANK_ADMIN", claims.get("role"));
        assertNull(claims.get("passwordHash"));
    }
}
