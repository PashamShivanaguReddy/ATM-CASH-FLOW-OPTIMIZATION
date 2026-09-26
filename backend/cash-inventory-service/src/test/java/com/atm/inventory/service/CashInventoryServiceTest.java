package com.atm.inventory.service;

import com.atm.common.exception.BusinessRuleException;
import com.atm.domain.entity.*;
import com.atm.domain.repository.*;
import com.atm.inventory.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CashInventoryServiceTest {
    @Mock ATMRepository atms;
    @Mock CashInventoryRepository inventory;
    @Mock CashRefillRepository refills;
    @Mock AuditLogRepository audits;
    @Mock UserRepository users;
    CashInventoryService service;
    ATM atm;
    Authentication admin;
    Authentication manager;
    Authentication operator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new CashInventoryService(atms, inventory, refills, audits, users);
        Bank bank = new Bank(); bank.setId(4L);
        atm = new ATM(); atm.setId(10L); atm.setBank(bank); atm.setCashCapacity(new BigDecimal("10000")); atm.setCurrentCash(BigDecimal.ZERO);
        atm.setMinimumCashThreshold(new BigDecimal("100")); atm.setStatus(AtmStatus.OUT_OF_SERVICE);
        admin = authentication("BANK_ADMIN", 4L, 1L);
        manager = authentication("BANK_MANAGER", 4L, 2L);
        operator = authentication("ATM_OPERATOR", 4L, 3L);
        when(atms.findById(10L)).thenReturn(Optional.of(atm));
        when(atms.findByIdForUpdate(10L)).thenReturn(Optional.of(atm));
        List<CashInventory> rows = new ArrayList<>();
        when(inventory.findByAtmId(10L)).thenReturn(rows);
        when(inventory.findByAtmIdForUpdate(10L)).thenReturn(rows);
        when(atms.save(any())).thenAnswer(i -> i.getArgument(0));
        when(inventory.save(any())).thenAnswer(i -> { CashInventory row = i.getArgument(0); if (!rows.contains(row)) rows.add(row); return row; });
        when(refills.save(any())).thenAnswer(i -> { CashRefill refill = i.getArgument(0); if (refill.getId() == null) refill.setId(20L); return refill; });
    }

    @Test
    void inventoryUpdateCalculatesTotalsAndAtmCash() {
        CashInventoryResponse result = service.updateInventory(10L, new CashInventoryUpdateRequest(List.of(
                new DenominationRequest(500, 4), new DenominationRequest(100, 3))), admin, "ip");
        assertThat(result.totalCash()).isEqualByComparingTo("2300");
        assertThat(atm.getCurrentCash()).isEqualByComparingTo("2300");
        verify(audits).save(any(AuditLog.class));
    }

    @Test
    void rejectsInvalidDenominationAndNegativeCash() {
        assertThatThrownBy(() -> service.updateInventory(10L, new CashInventoryUpdateRequest(List.of(new DenominationRequest(25, 1))), admin, "ip"))
                .isInstanceOf(BusinessRuleException.class).hasMessage("Invalid denomination");
        assertThatThrownBy(() -> service.updateInventory(10L, new CashInventoryUpdateRequest(List.of(new DenominationRequest(100, -1))), admin, "ip"))
                .isInstanceOf(BusinessRuleException.class).hasMessage("Note count cannot be negative");
    }

    @Test
    void requestsApprovesRejectsAndCompletesRefill() {
        RefillResponse requested = service.requestRefill(new RefillRequest(10L, new BigDecimal("1000"), "weekly"), admin, "ip");
        assertThat(requested.status()).isEqualTo(RefillStatus.REQUESTED);
        when(refills.findById(20L)).thenReturn(Optional.of(refill(RefillStatus.REQUESTED, new BigDecimal("1000"))));
        assertThat(service.approve(20L, manager, "ip").status()).isEqualTo(RefillStatus.APPROVED);
        CashRefill approved = refill(RefillStatus.APPROVED, new BigDecimal("1000")); approved.setId(20L);
        when(refills.findById(20L)).thenReturn(Optional.of(approved));
        assertThat(service.complete(20L, operator, "ip").status()).isEqualTo(RefillStatus.COMPLETED);
        assertThat(atm.getCurrentCash()).isEqualByComparingTo("1000");
        verify(audits, atLeast(3)).save(any(AuditLog.class));
    }

    @Test
    void rejectsRequestedRefill() {
        CashRefill requested = refill(RefillStatus.REQUESTED, new BigDecimal("1000")); requested.setId(20L);
        when(refills.findById(20L)).thenReturn(Optional.of(requested));
        assertThat(service.reject(20L, manager, "ip").status()).isEqualTo(RefillStatus.REJECTED);
        verify(atms, never()).save(any());
    }

    @Test
    void cashMutationsAcquirePessimisticAtmLock() {
        service.updateInventory(10L, new CashInventoryUpdateRequest(List.of(new DenominationRequest(100, 1))), admin, "ip");
        verify(atms).findByIdForUpdate(10L);
        verify(inventory).findByAtmIdForUpdate(10L);
    }

    @Test
    void rejectsRefillOverCapacity() {
        atm.setCurrentCash(new BigDecimal("9500"));
        assertThatThrownBy(() -> service.requestRefill(new RefillRequest(10L, new BigDecimal("501"), "too much"), admin, "ip"))
                .isInstanceOf(BusinessRuleException.class).hasMessage("Refill exceeds ATM cash capacity");
    }

    private CashRefill refill(RefillStatus status, BigDecimal amount) { CashRefill refill = new CashRefill(); refill.setAtm(atm); refill.setStatus(status); refill.setRefillAmount(amount); refill.setRefillDate(java.time.Instant.now()); return refill; }
    private Authentication authentication(String role, Long bankId, Long userId) { return new UsernamePasswordAuthenticationToken(new AtmPrincipal("user", userId, bankId, role), null); }
}
