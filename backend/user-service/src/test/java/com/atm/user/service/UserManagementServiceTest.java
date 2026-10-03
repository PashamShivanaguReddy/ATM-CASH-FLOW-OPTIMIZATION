package com.atm.user.service;

import com.atm.domain.entity.Bank;
import com.atm.domain.entity.User;
import com.atm.domain.entity.UserRole;
import com.atm.domain.entity.UserStatus;
import com.atm.domain.repository.BankRepository;
import com.atm.domain.repository.UserRepository;
import com.atm.user.dto.UserCreateRequest;
import com.atm.user.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserManagementServiceTest {
    private UserRepository users;
    private BankRepository banks;
    private UserManagementService service;
    private Authentication bankAdmin;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        banks = mock(BankRepository.class);
        service = new UserManagementService(users, banks, new BCryptPasswordEncoder());
        bankAdmin = new UsernamePasswordAuthenticationToken(
                new UserPrincipal("admin@example.com", 10L, 7L, "BANK_ADMIN"), null, List.of(() -> "ROLE_BANK_ADMIN"));
    }

    @Test
    void bankAdminCreationIsAssignedToTheirBankAndPasswordIsHashed() {
        Bank bank = new Bank();
        bank.setId(7L);
        when(users.findByEmail("operator@example.com")).thenReturn(Optional.empty());
        when(banks.findById(7L)).thenReturn(Optional.of(bank));
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.create(new UserCreateRequest("Casey", "Operator", " Operator@Example.com ", "long-password",
                "555-0100", 7L, UserRole.ATM_OPERATOR, UserStatus.ACTIVE), bankAdmin);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(users).save(savedUser.capture());
        assertEquals("operator@example.com", result.email());
        assertEquals(7L, result.bankId());
        assertEquals(UserRole.ATM_OPERATOR, result.role());
        assertTrue(new BCryptPasswordEncoder().matches("long-password", savedUser.getValue().getPasswordHash()));
    }

    @Test
    void bankAdminCannotAssignSuperAdminRole() {
        assertThrows(AccessDeniedException.class, () -> service.create(new UserCreateRequest("Root", "User",
                "root@example.com", "long-password", null, 7L, UserRole.SUPER_ADMIN, UserStatus.ACTIVE), bankAdmin));
        verify(users, never()).save(any(User.class));
    }

    @Test
    void bankAdminCannotReadUserFromAnotherBank() {
        Bank otherBank = new Bank();
        otherBank.setId(9L);
        User user = new User();
        user.setId(21L);
        user.setBank(otherBank);
        when(users.findById(21L)).thenReturn(Optional.of(user));

        assertThrows(AccessDeniedException.class, () -> service.get(21L, bankAdmin));
    }

    @Test
    void deleteDeactivatesInsteadOfRemovingHistory() {
        Bank bank = new Bank();
        bank.setId(7L);
        User user = new User();
        user.setId(21L);
        user.setBank(bank);
        user.setRole(UserRole.ATM_OPERATOR);
        user.setStatus(UserStatus.ACTIVE);
        when(users.findById(21L)).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);

        service.delete(21L, bankAdmin);

        assertEquals(UserStatus.INACTIVE, user.getStatus());
        verify(users).save(user);
        verify(users, never()).delete(any(User.class));
    }
}
