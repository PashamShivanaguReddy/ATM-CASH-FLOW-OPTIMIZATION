package com.atm.atm.service;

import com.atm.atm.dto.*;
import com.atm.atm.exception.AtmAuthorizationException;
import com.atm.common.exception.*;
import com.atm.domain.entity.*;
import com.atm.domain.repository.*;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;

@Service
public class ATMService {
    private final ATMRepository atms;
    private final BankRepository banks;
    private final ATMTransactionRepository transactions;
    private final AuditLogRepository audits;
    private final UserRepository users;

    public ATMService(ATMRepository atms, BankRepository banks, ATMTransactionRepository transactions,
                      AuditLogRepository audits, UserRepository users) {
        this.atms = atms; this.banks = banks; this.transactions = transactions; this.audits = audits; this.users = users;
    }

    @Transactional
    public AtmResponse create(AtmRequest request, Authentication authentication, String ip) {
        requireBankAccess(request.bankId(), authentication, true);
        if (atms.findByAtmCode(request.atmCode()).isPresent()) throw new ConflictException("ATM code already exists", "ATM_CODE_EXISTS");
        validateCash(request.cashCapacity(), request.minimumCashThreshold(), request.maximumCashThreshold(), request.currentCash());
        ATM atm = new ATM(); apply(atm, request); atm.setBank(banks.findById(request.bankId()).orElseThrow(() -> new ResourceNotFoundException("Bank not found", "BANK_NOT_FOUND")));
        ATM saved = atms.save(atm); audit(authentication, "ATM_CREATED", saved, null, saved.getAtmCode(), ip); return response(saved);
    }

    @Transactional(readOnly = true)
    public Page<AtmResponse> list(Long bankId, AtmStatus status, Pageable pageable, Authentication authentication) {
        AtmPrincipal principal = principal(authentication);
        Long effectiveBankId = bankId;
        if (principal == null) throw new AtmAuthorizationException("Authentication required");
        if (!"SUPER_ADMIN".equals(principal.role())) {
            if (principal.bankId() == null) throw new AtmAuthorizationException("User is not assigned to a bank");
            if (bankId != null && !principal.bankId().equals(bankId)) throw new AtmAuthorizationException("User is not authorized for this bank");
            effectiveBankId = principal.bankId();
        }
        Page<ATM> page = effectiveBankId != null && status != null ? atms.findByBankIdAndStatus(effectiveBankId, status, pageable) :
                effectiveBankId != null ? atms.findByBankId(effectiveBankId, pageable) : status != null ? atms.findByStatus(status, pageable) : atms.findAll(pageable);
        return page.map(this::response);
    }

    @Transactional(readOnly = true)
    public AtmResponse get(Long id, Authentication authentication) { return response(authorizedAtm(id, authentication, false)); }

    @Transactional
    public AtmResponse update(Long id, AtmRequest request, Authentication authentication, String ip) {
        ATM atm = authorizedAtm(id, authentication, true); requireBankAccess(request.bankId(), authentication, true);
        if (!atm.getAtmCode().equals(request.atmCode()) && atms.findByAtmCode(request.atmCode()).isPresent()) throw new ConflictException("ATM code already exists", "ATM_CODE_EXISTS");
        validateCash(request.cashCapacity(), request.minimumCashThreshold(), request.maximumCashThreshold(), request.currentCash());
        String old = atm.getAtmCode() + ":" + atm.getCurrentCash(); apply(atm, request); atm.setBank(banks.findById(request.bankId()).orElseThrow(() -> new ResourceNotFoundException("Bank not found", "BANK_NOT_FOUND")));
        ATM saved = atms.save(atm); audit(authentication, "ATM_UPDATED", saved, old, saved.getAtmCode() + ":" + saved.getCurrentCash(), ip); return response(saved);
    }

    @Transactional
    public void delete(Long id, Authentication authentication, String ip) {
        ATM atm = authorizedAtm(id, authentication, true); String oldStatus = atm.getStatus().name(); atm.setStatus(AtmStatus.INACTIVE); atms.save(atm);
        audit(authentication, "ATM_DEACTIVATED", atm, oldStatus, AtmStatus.INACTIVE.name(), ip);
    }

    @Transactional(readOnly = true)
    public AtmSummaryResponse summary(Long id, Authentication authentication) {
        ATM atm = authorizedAtm(id, authentication, false); long count = transactions.countByAtmId(id);
        return new AtmSummaryResponse(atm.getId(), atm.getAtmCode(), atm.getBank().getId(), atm.getStatus(), atm.getCashCapacity(), atm.getCurrentCash(), count, atm.getCurrentCash().compareTo(atm.getMinimumCashThreshold()) <= 0);
    }

    private ATM authorizedAtm(Long id, Authentication authentication, boolean modify) {
        ATM atm = atms.findById(id).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
        requireBankAccess(atm.getBank().getId(), authentication, modify); return atm;
    }

    private void requireBankAccess(Long bankId, Authentication authentication, boolean modify) {
        AtmPrincipal principal = principal(authentication);
        if (principal == null) throw new AtmAuthorizationException("Authentication required");
        if ("SUPER_ADMIN".equals(principal.role())) return;
        if (principal.bankId() == null || !principal.bankId().equals(bankId)) throw new AtmAuthorizationException("User is not authorized for this bank");
        if (modify && !java.util.Set.of("BANK_ADMIN", "BANK_MANAGER", "ATM_OPERATOR").contains(principal.role())) throw new AtmAuthorizationException("User cannot modify ATMs");
    }

    private AtmPrincipal principal(Authentication authentication) { return authentication == null ? null : (authentication.getPrincipal() instanceof AtmPrincipal p ? p : null); }
    private void validateCash(BigDecimal capacity, BigDecimal minimum, BigDecimal maximum, BigDecimal current) {
        if (capacity.signum() <= 0) throw new BusinessRuleException("Cash capacity must be positive", "INVALID_CASH_CAPACITY");
        if (minimum.signum() < 0 || maximum.signum() < 0 || current.signum() < 0) throw new BusinessRuleException("Cash values cannot be negative", "NEGATIVE_CASH_VALUE");
        if (minimum.compareTo(maximum) > 0) throw new BusinessRuleException("Minimum threshold cannot exceed maximum threshold", "INVALID_THRESHOLDS");
        if (current.compareTo(capacity) > 0) throw new BusinessRuleException("Current cash cannot exceed cash capacity", "CASH_EXCEEDS_CAPACITY");
    }
    private void apply(ATM atm, AtmRequest r) {
        atm.setAtmCode(r.atmCode()); atm.setLocation(r.location()); atm.setCity(r.city()); atm.setState(r.state()); atm.setLatitude(r.latitude()); atm.setLongitude(r.longitude()); atm.setAtmType(r.atmType());
        AtmStatus calculated = r.currentCash().signum() == 0 ? AtmStatus.OUT_OF_SERVICE : r.currentCash().compareTo(r.minimumCashThreshold()) <= 0 ? AtmStatus.LOW_CASH : r.status() == null ? AtmStatus.ACTIVE : r.status();
        atm.setStatus(calculated); atm.setCashCapacity(r.cashCapacity()); atm.setMinimumCashThreshold(r.minimumCashThreshold()); atm.setMaximumCashThreshold(r.maximumCashThreshold()); atm.setCurrentCash(r.currentCash());
    }
    private AtmResponse response(ATM a) { return new AtmResponse(a.getId(), a.getAtmCode(), a.getBank().getId(), a.getLocation(), a.getCity(), a.getState(), a.getLatitude(), a.getLongitude(), a.getAtmType(), a.getStatus(), a.getCashCapacity(), a.getMinimumCashThreshold(), a.getMaximumCashThreshold(), a.getCurrentCash(), a.getLastRefillAt(), a.getCreatedAt(), a.getUpdatedAt()); }
    private void audit(Authentication auth, String action, ATM atm, String oldValue, String newValue, String ip) { AuditLog log = new AuditLog(); AtmPrincipal p = principal(auth); if (p != null && p.userId() != null) log.setUser(users.findById(p.userId()).orElse(null)); log.setAction(action); log.setEntityType("ATM"); log.setEntityId(atm.getId()); log.setOldValue(oldValue); log.setNewValue(newValue); log.setTimestamp(Instant.now()); log.setIpAddress(ip); audits.save(log); }
}