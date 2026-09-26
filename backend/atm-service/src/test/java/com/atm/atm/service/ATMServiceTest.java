package com.atm.atm.service;

import com.atm.atm.dto.AtmRequest;
import com.atm.atm.exception.AtmAuthorizationException;
import com.atm.common.exception.*;
import com.atm.domain.entity.*;
import com.atm.domain.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.data.domain.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import java.math.BigDecimal;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ATMServiceTest {
    @Mock ATMRepository atms; @Mock BankRepository banks; @Mock ATMTransactionRepository transactions; @Mock AuditLogRepository audits; @Mock UserRepository users;
    ATMService service; Authentication bankAdmin;
    @BeforeEach void setUp() { service = new ATMService(atms, banks, transactions, audits, users); bankAdmin = auth(7L, 1L, "BANK_ADMIN"); }

    @Test void createsAtm() { AtmRequest request = request("ATM-1", bd("1000"), bd("100"), bd("900"), bd("500")); Bank bank = new Bank(); bank.setId(1L); when(atms.findByAtmCode("ATM-1")).thenReturn(Optional.empty()); when(banks.findById(1L)).thenReturn(Optional.of(bank)); when(atms.save(any())).thenAnswer(i -> { ATM a = i.getArgument(0); a.setId(10L); a.setBank(bank); return a; }); assertThat(service.create(request, bankAdmin, "127.0.0.1").atmCode()).isEqualTo("ATM-1"); verify(audits).save(any()); }
    @Test void rejectsDuplicateCode() { when(atms.findByAtmCode("ATM-1")).thenReturn(Optional.of(new ATM())); assertThatThrownBy(() -> service.create(request("ATM-1", bd("1000"), bd("100"), bd("900"), bd("500")), bankAdmin, "ip")).isInstanceOf(ConflictException.class); }
    @Test void rejectsInvalidCashCapacity() { when(atms.findByAtmCode(anyString())).thenReturn(Optional.empty()); assertThatThrownBy(() -> service.create(request("ATM-1", bd("0"), bd("0"), bd("0"), bd("0")), bankAdmin, "ip")).isInstanceOf(BusinessRuleException.class); }
    @Test void rejectsInvalidThresholds() { when(atms.findByAtmCode(anyString())).thenReturn(Optional.empty()); assertThatThrownBy(() -> service.create(request("ATM-1", bd("1000"), bd("900"), bd("100"), bd("500")), bankAdmin, "ip")).isInstanceOf(BusinessRuleException.class); }
    @Test void updatesAtm() { ATM atm = atm(10L, 1L); Bank bank = atm.getBank(); when(atms.findById(10L)).thenReturn(Optional.of(atm)); when(atms.findByAtmCode("ATM-2")).thenReturn(Optional.empty()); when(banks.findById(1L)).thenReturn(Optional.of(bank)); when(atms.save(any())).thenAnswer(i -> i.getArgument(0)); assertThat(service.update(10L, request("ATM-2", bd("1000"), bd("100"), bd("900"), bd("300")), bankAdmin, "ip").atmCode()).isEqualTo("ATM-2"); }
    @Test void getsAtm() { ATM atm = atm(10L, 1L); when(atms.findById(10L)).thenReturn(Optional.of(atm)); assertThat(service.get(10L, bankAdmin).id()).isEqualTo(10L); }
    @Test void paginatesAndFiltersByBank() { when(atms.findByBankId(eq(1L), any())).thenReturn(new PageImpl<>(java.util.List.of(atm(10L, 1L)))); assertThat(service.list(null, null, PageRequest.of(0, 10), bankAdmin)).hasSize(1); verify(atms).findByBankId(eq(1L), any()); }
    @Test void filtersByStatus() { when(atms.findByBankIdAndStatus(eq(1L), eq(AtmStatus.LOW_CASH), any())).thenReturn(Page.empty()); assertThat(service.list(null, AtmStatus.LOW_CASH, PageRequest.of(0, 10), bankAdmin)).isEmpty(); verify(atms).findByBankIdAndStatus(eq(1L), eq(AtmStatus.LOW_CASH), any()); }
    @Test void rejectsUnauthorizedBank() { assertThatThrownBy(() -> service.create(request("ATM-1", bd("1000"), bd("100"), bd("900"), bd("500"), 2L), bankAdmin, "ip")).isInstanceOf(AtmAuthorizationException.class); }
    @Test void rejectsMissingAtm() { when(atms.findById(99L)).thenReturn(Optional.empty()); assertThatThrownBy(() -> service.get(99L, bankAdmin)).isInstanceOf(ResourceNotFoundException.class); }
    @Test void deactivatesAtmWithoutDeletingIt() { ATM atm = atm(10L, 1L); when(atms.findById(10L)).thenReturn(Optional.of(atm)); service.delete(10L, bankAdmin, "ip"); assertThat(atm.getStatus()).isEqualTo(AtmStatus.INACTIVE); verify(atms).save(atm); }

    private Authentication auth(Long userId, Long bankId, String role) { return new UsernamePasswordAuthenticationToken(new AtmPrincipal("admin@example.com", userId, bankId, role), null); }
    private ATM atm(Long id, Long bankId) { ATM atm = new ATM(); atm.setId(id); Bank bank = new Bank(); bank.setId(bankId); atm.setBank(bank); atm.setAtmCode("ATM-" + id); atm.setStatus(AtmStatus.ACTIVE); atm.setCashCapacity(bd("1000")); atm.setMinimumCashThreshold(bd("100")); atm.setMaximumCashThreshold(bd("900")); atm.setCurrentCash(bd("500")); atm.setLocation("Main"); atm.setCity("City"); atm.setState("State"); atm.setLatitude(bd("10")); atm.setLongitude(bd("20")); atm.setAtmType(AtmType.STANDARD); return atm; }
    private AtmRequest request(String code, BigDecimal capacity, BigDecimal minimum, BigDecimal maximum, BigDecimal current) { return request(code, capacity, minimum, maximum, current, 1L); }
    private AtmRequest request(String code, BigDecimal capacity, BigDecimal minimum, BigDecimal maximum, BigDecimal current, Long bankId) { return new AtmRequest(code, bankId, "Main", "City", "State", bd("10"), bd("20"), AtmType.STANDARD, null, capacity, minimum, maximum, current); }
    private BigDecimal bd(String value) { return new BigDecimal(value); }
}