package com.atm.bank.service;

import com.atm.bank.dto.BankCreateRequest;
import com.atm.domain.entity.Bank;
import com.atm.domain.entity.BankStatus;
import com.atm.domain.repository.BankRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BankServiceTest {
    @Mock
    private BankRepository banks;

    @InjectMocks
    private BankService service;

    @Test
    void createsBankOnlyForSuperAdmin() {
        var authentication = authentication("ROLE_SUPER_ADMIN", null);
        when(banks.findByBankCode("BANK-001")).thenReturn(Optional.empty());
        when(banks.save(any(Bank.class))).thenAnswer(invocation -> {
            Bank bank = invocation.getArgument(0);
            bank.setId(1L);
            return bank;
        });

        var result = service.create(new BankCreateRequest(" BANK-001 ", "Test Bank", null, null, null), authentication);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.bankCode()).isEqualTo("BANK-001");
        assertThat(result.status()).isEqualTo(BankStatus.ACTIVE);
    }

    @Test
    void rejectsBankCreationForNonAdmin() {
        var authentication = authentication("ROLE_ATM_OPERATOR", null);

        assertThatThrownBy(() -> service.create(
                new BankCreateRequest("BANK-001", "Test Bank", null, null, null), authentication))
                .isInstanceOf(AccessDeniedException.class);
    }

    private UsernamePasswordAuthenticationToken authentication(String role, Long bankId) {
        return new UsernamePasswordAuthenticationToken(
                new BankPrincipal("test@example.com", 1L, bankId, role.substring("ROLE_".length())),
                null, List.of(new SimpleGrantedAuthority(role)));
    }
}
