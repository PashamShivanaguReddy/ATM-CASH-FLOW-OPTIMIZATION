package com.atm.auth.config;

import com.atm.domain.entity.User;
import com.atm.domain.entity.UserRole;
import com.atm.domain.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the one initial administrator only when explicitly supplied by the deployment environment.
 * Existing administrators are never duplicated or replaced.
 */
@Component
public class InitialSuperAdminBootstrap implements CommandLineRunner {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public InitialSuperAdminBootstrap(UserRepository users, PasswordEncoder passwordEncoder,
                                      @Value("${bootstrap.super-admin.email:}") String email,
                                      @Value("${bootstrap.super-admin.password:}") String password) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.email = email == null ? "" : email.trim().toLowerCase();
        this.password = password == null ? "" : password;
    }

    @Override
    @Transactional
    public void run(String... args) {
        long existing = users.countByRole(UserRole.SUPER_ADMIN);
        if (existing > 0) {
            return;
        }
        if (email.isBlank() && password.isBlank()) {
            return;
        }
        if (email.isBlank() || password.isBlank() || password.length() < 12
                || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalStateException("INITIAL_SUPER_ADMIN_EMAIL and INITIAL_SUPER_ADMIN_PASSWORD must be valid and set together");
        }
        User admin = new User();
        admin.setFirstName("Initial");
        admin.setLastName("Administrator");
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(UserRole.SUPER_ADMIN);
        users.save(admin);
    }
}
