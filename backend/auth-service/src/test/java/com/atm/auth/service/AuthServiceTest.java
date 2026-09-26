package com.atm.auth.service;

import com.atm.auth.entity.RefreshToken;
import com.atm.auth.repository.RefreshTokenRepository;
import com.atm.auth.security.JwtService;
import com.atm.domain.entity.User;
import com.atm.domain.entity.UserRole;
import com.atm.domain.entity.Bank;
import com.atm.domain.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository users; @Mock BankRepository banks; @Mock AuditLogRepository audits; @Mock RefreshTokenRepository refreshTokens; @Mock AuthenticationManager authenticationManager;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private AuthService service() { return new AuthService(users, banks, audits, refreshTokens, encoder, new JwtService("a-strong-test-secret-with-at-least-32-chars", 3600000), authenticationManager, 604800000); }
    private User user() { var user = new User(); user.setId(1L); user.setEmail("user@example.com"); user.setPasswordHash(encoder.encode("correct-password")); user.setRole(UserRole.ATM_OPERATOR); return user; }
    @Test void successfulLoginReturnsTokens() {
        var user = user(); when(users.findByEmail("user@example.com")).thenReturn(Optional.of(user)); when(refreshTokens.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var response = service().login(new com.atm.auth.dto.LoginRequest("user@example.com", "correct-password"), "127.0.0.1");
        assertNotNull(response.accessToken()); assertNotNull(response.refreshToken()); verify(audits).save(any());
    }
    @Test void invalidPasswordReturnsUnauthorized() {
        doThrow(new BadCredentialsException("bad password")).when(authenticationManager).authenticate(any());
        assertThrows(ResponseStatusException.class, () -> service().login(new com.atm.auth.dto.LoginRequest("user@example.com", "wrong-password"), "127.0.0.1"));
        verify(refreshTokens, never()).save(any());
    }
    @Test void refreshRotatesAndRevokesStoredToken() throws Exception {
        var user = user(); var raw = "refresh-value"; var stored = new RefreshToken(); stored.setUser(user); stored.setExpiresAt(Instant.now().plusSeconds(60));
        when(refreshTokens.findByTokenHash(hash(raw))).thenReturn(Optional.of(stored)); when(refreshTokens.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var response = service().refresh(raw, "127.0.0.1");
        assertNotNull(response.accessToken()); assertNotEquals(raw, response.refreshToken()); assertNotNull(stored.getRevokedAt());
    }
    @Test void publicRegistrationCannotChooseBank() {
        when(users.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(2L);
            return saved;
        });
        when(refreshTokens.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var request = new com.atm.auth.dto.RegisterRequest("New", "User", "new@example.com",
                "correct-password", 99L, UserRole.BANK_ADMIN);

        service().register(request, "127.0.0.1");

        var captor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users, atLeastOnce()).save(captor.capture());
        assertNull(captor.getAllValues().get(0).getBank());
        verify(banks, never()).findById(anyLong());
    }
    @Test void superAdminCanAssignUserToAnyBank() {
        User target = user();
        Bank bank = new Bank();
        bank.setId(7L);
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        List<GrantedAuthority> authorities = List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
        doReturn(authorities).when(authentication).getAuthorities();
        when(users.findById(1L)).thenReturn(Optional.of(target));
        when(banks.findById(7L)).thenReturn(Optional.of(bank));

        service().assignBank(1L, 7L, authentication);

        assertSame(bank, target.getBank());
        verify(users).save(target);
        verify(audits).save(any());
    }
    @Test void bankAdminCannotAssignUserToAnotherBank() {
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        List<GrantedAuthority> authorities = List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_BANK_ADMIN"));
        doReturn(authorities).when(authentication).getAuthorities();
        when(authentication.getPrincipal()).thenReturn(new com.atm.auth.security.AuthenticatedUser("admin@example.com", 2L, 3L, "BANK_ADMIN"));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service().assignBank(1L, 7L, authentication));
        verifyNoInteractions(users, banks, audits);
    }
    @Test void bankAdminCanAssignUserOnlyToOwnBank() {
        User target = user();
        Bank bank = new Bank();
        bank.setId(3L);
        var authentication = mock(org.springframework.security.core.Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        List<GrantedAuthority> authorities = List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_BANK_ADMIN"));
        doReturn(authorities).when(authentication).getAuthorities();
        when(authentication.getPrincipal()).thenReturn(new com.atm.auth.security.AuthenticatedUser("admin@example.com", 2L, 3L, "BANK_ADMIN"));
        when(users.findById(1L)).thenReturn(Optional.of(target));
        when(banks.findById(3L)).thenReturn(Optional.of(bank));

        service().assignBank(1L, 3L, authentication);

        assertSame(bank, target.getBank());
        verify(users).save(target);
    }
    private static String hash(String value) throws Exception { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
}
