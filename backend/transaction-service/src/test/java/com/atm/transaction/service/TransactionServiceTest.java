package com.atm.transaction.service;

import com.atm.common.exception.BusinessRuleException;
import com.atm.common.exception.ConflictException;
import com.atm.domain.entity.*;
import com.atm.domain.repository.*;
import com.atm.transaction.dto.TransactionCreateRequest;
import com.atm.transaction.event.TransactionEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {
    @Mock ATMTransactionRepository transactions;
    @Mock ATMRepository atms;
    @Mock AuditLogRepository audits;
    @Mock UserRepository users;
    @Mock ApplicationEventPublisher events;
    TransactionService service;
    Authentication bankUser;
    ATM atm;
    Instant timestamp = Instant.parse("2026-01-01T10:00:00Z");

    @BeforeEach
    void setUp() {
        service = new TransactionService(transactions, atms, audits, users, events);
        bankUser = new UsernamePasswordAuthenticationToken(new AtmPrincipal("bank@example.com", 7L, 1L, "BANK_ADMIN"), null);
        atm = new ATM(); atm.setId(10L); atm.setStatus(AtmStatus.ACTIVE); atm.setCurrentCash(new BigDecimal("500")); atm.setCashCapacity(new BigDecimal("1000"));
        atm.setMinimumCashThreshold(new BigDecimal("100")); atm.setMaximumCashThreshold(new BigDecimal("900"));
        Bank bank = new Bank(); bank.setId(1L); atm.setBank(bank);
        lenient().when(atms.findByIdForUpdate(10L)).thenReturn(Optional.of(atm));
        lenient().when(transactions.save(any())).thenAnswer(invocation -> { ATMTransaction value = invocation.getArgument(0); value.setId(20L); return value; });
    }

    @Test
    void successfulWithdrawalUpdatesCashAndAudit() {
        var result = service.create(request("w-1", TransactionType.WITHDRAWAL, "100", true), bankUser, "127.0.0.1");
        assertThat(result.created()).isTrue(); assertThat(atm.getCurrentCash()).isEqualByComparingTo("400");
        verify(audits).save(any(AuditLog.class)); verify(events, atLeastOnce()).publishEvent(any(TransactionEvent.class));
    }

    @Test
    void successfulDepositUpdatesCash() {
        service.create(request("d-1", TransactionType.DEPOSIT, "100", true), bankUser, "ip");
        assertThat(atm.getCurrentCash()).isEqualByComparingTo("600");
    }

    @Test
    void insufficientWithdrawalDoesNotChangeCash() {
        assertThatThrownBy(() -> service.create(request("w-2", TransactionType.WITHDRAWAL, "501", true), bankUser, "ip"))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(atm.getCurrentCash()).isEqualByComparingTo("500"); verify(transactions, never()).save(any());
    }

    @Test
    void depositOverCapacityDoesNotChangeCash() {
        assertThatThrownBy(() -> service.create(request("d-2", TransactionType.DEPOSIT, "501", true), bankUser, "ip"))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(atm.getCurrentCash()).isEqualByComparingTo("500");
    }

    @Test
    void failedTransactionPreservesCashAndIsStored() {
        service.create(request("f-1", TransactionType.WITHDRAWAL, "125", false), bankUser, "ip");
        assertThat(atm.getCurrentCash()).isEqualByComparingTo("500"); verify(transactions).save(any()); verify(audits).save(any());
    }

    @Test
    void duplicateIdenticalTransactionIsReturnedWithoutProcessingAgain() {
        ATMTransaction existing = transaction("w-3", "125", true); when(transactions.findByTransactionId("w-3")).thenReturn(Optional.of(existing));
        var result = service.create(request("w-3", TransactionType.WITHDRAWAL, "125", true), bankUser, "ip");
        assertThat(result.created()).isFalse(); verify(atms, never()).findByIdForUpdate(any()); verify(transactions, never()).save(any());
    }

    @Test
    void duplicateDifferentPayloadIsConflict() {
        when(transactions.findByTransactionId("w-4")).thenReturn(Optional.of(transaction("w-4", "125", true)));
        assertThatThrownBy(() -> service.create(request("w-4", TransactionType.WITHDRAWAL, "126", true), bankUser, "ip"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void negativeAmountIsRejected() {
        assertThatThrownBy(() -> service.create(request("n-1", TransactionType.WITHDRAWAL, "-1", true), bankUser, "ip"))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void successfulCashOperationsMustMatchSupportedDenominations() {
        assertThatThrownBy(() -> service.create(request("w-invalid-note", TransactionType.WITHDRAWAL, "125", true), bankUser, "ip"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Amount must be a multiple of the smallest supported denomination");
        assertThat(atm.getCurrentCash()).isEqualByComparingTo("500");
    }

    @Test
    void inactiveAtmIsRejected() {
        atm.setStatus(AtmStatus.INACTIVE);
        assertThatThrownBy(() -> service.create(request("i-1", TransactionType.WITHDRAWAL, "1", true), bankUser, "ip"))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(atm.getCurrentCash()).isEqualByComparingTo("500");
    }

    @Test
    void summaryAggregatesSuccessfulTransactions() {
        when(atms.findById(10L)).thenReturn(Optional.of(atm));
        when(transactions.sumSuccessfulAmount(10L, TransactionType.WITHDRAWAL, timestamp.minusSeconds(3600), timestamp.plusSeconds(3600))).thenReturn(new BigDecimal("125"));
        when(transactions.sumSuccessfulAmount(10L, TransactionType.DEPOSIT, timestamp.minusSeconds(3600), timestamp.plusSeconds(3600))).thenReturn(new BigDecimal("50"));
        when(transactions.countSuccessful(10L, timestamp.minusSeconds(3600), timestamp.plusSeconds(3600))).thenReturn(2L);
        when(transactions.averageSuccessfulAmount(10L, TransactionType.WITHDRAWAL, timestamp.minusSeconds(3600), timestamp.plusSeconds(3600))).thenReturn(new BigDecimal("125"));
        when(transactions.maximumSuccessfulAmount(10L, TransactionType.WITHDRAWAL, timestamp.minusSeconds(3600), timestamp.plusSeconds(3600))).thenReturn(new BigDecimal("125"));
        when(transactions.findByAtmIdAndTimestampBetween(10L, timestamp.minusSeconds(3600), timestamp.plusSeconds(3600))).thenReturn(java.util.List.of(transaction("w-summary", "125", true)));

        var result = service.summary(10L, timestamp.minusSeconds(3600), timestamp.plusSeconds(3600), bankUser);

        assertThat(result.numberOfTransactions()).isEqualTo(2L);
        assertThat(result.totalWithdrawals()).isEqualByComparingTo("125");
        assertThat(result.totalDeposits()).isEqualByComparingTo("50");
        assertThat(result.peakTransactionHour()).isEqualTo(10);
    }

    @Test
    void searchReturnsTransactionsFromCriteriaRepository() {
        var pageable = PageRequest.of(0, 20);
        when(transactions.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(java.util.List.of(transaction("listed-1", "125", true))));

        var result = service.search(null, null, null, null, null, pageable, bankUser);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).transactionId()).isEqualTo("listed-1");
        verify(transactions).findAll(any(Specification.class), eq(pageable));
    }

    private TransactionCreateRequest request(String id, TransactionType type, String amount, boolean success) {
        return new TransactionCreateRequest(id, 10L, type, new BigDecimal(amount), timestamp, success, "VISA");
    }
    private ATMTransaction transaction(String id, String amount, boolean success) {
        ATMTransaction value = new ATMTransaction(); value.setId(20L); value.setTransactionId(id); value.setAtm(atm); value.setTransactionType(TransactionType.WITHDRAWAL);
        value.setAmount(new BigDecimal(amount)); value.setTimestamp(timestamp); value.setSuccess(success); value.setCardType("VISA"); return value;
    }
}
