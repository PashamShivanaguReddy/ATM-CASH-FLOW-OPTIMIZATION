package com.atm.auth.service;

import com.atm.auth.dto.*;
import com.atm.auth.entity.RefreshToken;
import com.atm.auth.repository.RefreshTokenRepository;
import com.atm.auth.security.JwtService;
import com.atm.domain.entity.*;
import com.atm.domain.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.AccessDeniedException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthService {
    private final UserRepository users; private final BankRepository banks; private final AuditLogRepository audits;
    private final RefreshTokenRepository refreshTokens; private final PasswordEncoder encoder; private final JwtService jwt;
    private final AuthenticationManager authenticationManager; private final long refreshExpirationMs;
    private final SecureRandom random = new SecureRandom();
    public AuthService(UserRepository users, BankRepository banks, AuditLogRepository audits, RefreshTokenRepository refreshTokens,
                       PasswordEncoder encoder, JwtService jwt, AuthenticationManager authenticationManager,
                       @Value("${jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        this.users = users; this.banks = banks; this.audits = audits; this.refreshTokens = refreshTokens; this.encoder = encoder;
        this.jwt = jwt; this.authenticationManager = authenticationManager; this.refreshExpirationMs = refreshExpirationMs;
    }
    @Transactional
    public LoginResponse register(RegisterRequest request, String ip) {
        String email = request.email().trim().toLowerCase();
        if (users.findByEmail(email).isPresent()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        var user = new User(); user.setFirstName(request.firstName()); user.setLastName(request.lastName()); user.setEmail(email);
        user.setPasswordHash(encoder.encode(request.password())); user.setRole(UserRole.ATM_OPERATOR);
        // Bank membership is assigned only through the authenticated administration endpoint.
        user.setBank(null);
        user = users.save(user); return issueTokens(user, ip, "REGISTER");
    }

    @Transactional
    public void assignBank(Long userId, Long bankId, org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean superAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
        boolean bankAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_BANK_ADMIN".equals(a.getAuthority()));
        Long callerBankId = authentication.getPrincipal() instanceof com.atm.auth.security.AuthenticatedUser principal
                ? principal.bankId() : null;
        if (!superAdmin && (!bankAdmin || callerBankId == null || !callerBankId.equals(bankId))) {
            throw new AccessDeniedException("Not authorized to assign users to this bank");
        }
        User target = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (target.getRole() == UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SUPER_ADMIN cannot be assigned to a bank");
        }
        target.setBank(banks.findById(bankId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank not found")));
        users.save(target);
        audit(target, "BANK_ASSIGNMENT", null);
    }
    @Transactional
    public LoginResponse login(LoginRequest request, String ip) {
        String email = request.email().trim().toLowerCase();
        try { authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password())); }
        catch (AuthenticationException exception) { throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"); }
        var user = users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        return issueTokens(user, ip, "LOGIN");
    }
    @Transactional
    public RefreshTokenResponse refresh(String rawToken, String ip) {
        var stored = refreshTokens.findByTokenHash(hash(rawToken)).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (stored.getRevokedAt() != null || stored.getExpiresAt().isBefore(Instant.now()) || stored.getUser().getStatus() != UserStatus.ACTIVE)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is expired or revoked");
        stored.setRevokedAt(Instant.now()); refreshTokens.save(stored);
        String nextRefresh = createRefreshToken(stored.getUser());
        audit(stored.getUser(), "TOKEN_REFRESH", ip); return new RefreshTokenResponse(jwt.generate(stored.getUser()), nextRefresh, jwt.getExpirationSeconds(), "Bearer");
    }
    @Transactional public void logout(String rawToken) {
        refreshTokens.findByTokenHash(hash(rawToken)).ifPresent(token -> { token.setRevokedAt(Instant.now()); refreshTokens.save(token); });
    }
    private LoginResponse issueTokens(User user, String ip, String action) {
        String refresh = createRefreshToken(user); audit(user, action, ip);
        return new LoginResponse(jwt.generate(user), refresh, "Bearer", jwt.getExpirationSeconds(), user.getId(), user.getEmail(), user.getRole().name(), user.getBank() == null ? null : user.getBank().getId());
    }
    private String createRefreshToken(User user) {
        byte[] bytes = new byte[48]; random.nextBytes(bytes); String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        var token = new RefreshToken(); token.setUser(user); token.setTokenHash(hash(raw)); token.setCreatedAt(Instant.now()); token.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs)); refreshTokens.save(token); return raw;
    }
    private void audit(User user, String action, String ip) {
        var audit = new AuditLog(); audit.setUser(user); audit.setAction(action); audit.setEntityType("AUTHENTICATION"); audit.setEntityId(user.getId()); audit.setTimestamp(Instant.now()); audit.setIpAddress(ip); audits.save(audit);
    }
    private String hash(String value) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (Exception ex) { throw new IllegalStateException(ex); } }
}
