package com.atm.auth.config;

import com.atm.domain.entity.User;
import com.atm.domain.entity.UserRole;
import com.atm.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InitialSuperAdminBootstrapTest {
    @Test
    void createsOnlyConfiguredInitialAdmin() {
        UserRepository users = mock(UserRepository.class);
        when(users.countByRole(UserRole.SUPER_ADMIN)).thenReturn(0L);
        InitialSuperAdminBootstrap bootstrap = new InitialSuperAdminBootstrap(users, new BCryptPasswordEncoder(),
                "Admin@example.com", "a-long-initial-password");

        bootstrap.run();

        var captor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).save(captor.capture());
        assertEquals("admin@example.com", captor.getValue().getEmail());
        assertEquals(UserRole.SUPER_ADMIN, captor.getValue().getRole());
        assertTrue(new BCryptPasswordEncoder().matches("a-long-initial-password", captor.getValue().getPasswordHash()));
    }

    @Test
    void neverDuplicatesExistingAdmin() {
        UserRepository users = mock(UserRepository.class);
        when(users.countByRole(UserRole.SUPER_ADMIN)).thenReturn(1L);
        new InitialSuperAdminBootstrap(users, new BCryptPasswordEncoder(),
                "admin@example.com", "a-long-initial-password").run();
        verify(users, never()).save(any());
    }

    @Test
    void refusesPartialBootstrapCredentials() {
        UserRepository users = mock(UserRepository.class);
        when(users.countByRole(UserRole.SUPER_ADMIN)).thenReturn(0L);
        var bootstrap = new InitialSuperAdminBootstrap(users, new BCryptPasswordEncoder(),
                "admin@example.com", "");
        assertThrows(IllegalStateException.class, bootstrap::run);
    }
}
