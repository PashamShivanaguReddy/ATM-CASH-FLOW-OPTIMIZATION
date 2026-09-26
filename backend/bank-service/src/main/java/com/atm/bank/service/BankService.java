package com.atm.bank.service;

import com.atm.bank.dto.BankCreateRequest;
import com.atm.common.exception.ConflictException;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.dto.BankDto;
import com.atm.domain.entity.Bank;
import com.atm.domain.entity.BankStatus;
import com.atm.domain.repository.BankRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BankService {
    private final BankRepository banks;

    public BankService(BankRepository banks) {
        this.banks = banks;
    }

    @Transactional
    public BankDto create(BankCreateRequest request, Authentication authentication) {
        requireRole(authentication, "SUPER_ADMIN");
        String code = request.bankCode().trim();
        if (banks.findByBankCode(code).isPresent()) {
            throw new ConflictException("Bank code already exists", "BANK_CODE_EXISTS");
        }
        Bank bank = new Bank();
        bank.setBankCode(code);
        bank.setName(request.name().trim());
        bank.setEmail(request.email());
        bank.setPhone(request.phone());
        bank.setAddress(request.address());
        bank.setStatus(BankStatus.ACTIVE);
        return toDto(banks.save(bank));
    }

    @Transactional(readOnly = true)
    public Page<BankDto> list(Pageable pageable, Authentication authentication) {
        requireAuthenticated(authentication);
        if (isSuperAdmin(authentication)) {
            return banks.findAll(pageable).map(this::toDto);
        }
        Long bankId = bankId(authentication);
        if (bankId == null) {
            throw new AccessDeniedException("User is not assigned to a bank");
        }
        Bank bank = banks.findById(bankId)
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found", "BANK_NOT_FOUND"));
        return new PageImpl<>(List.of(toDto(bank)), pageable, 1);
    }

    @Transactional(readOnly = true)
    public BankDto get(Long id, Authentication authentication) {
        requireAuthenticated(authentication);
        Bank bank = banks.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found", "BANK_NOT_FOUND"));
        if (!isSuperAdmin(authentication) && !id.equals(bankId(authentication))) {
            throw new AccessDeniedException("User is not authorized for this bank");
        }
        return toDto(bank);
    }

    private void requireRole(Authentication authentication, String role) {
        requireAuthenticated(authentication);
        if (authentication.getAuthorities().stream()
                .noneMatch(authority -> ("ROLE_" + role).equals(authority.getAuthority()))) {
            throw new AccessDeniedException("Forbidden");
        }
    }

    private void requireAuthenticated(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
    }

    private boolean isSuperAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SUPER_ADMIN".equals(authority.getAuthority()));
    }

    private Long bankId(Authentication authentication) {
        return authentication.getPrincipal() instanceof BankPrincipal principal ? principal.bankId() : null;
    }

    private BankDto toDto(Bank bank) {
        return new BankDto(bank.getId(), bank.getBankCode(), bank.getName(), bank.getEmail(),
                bank.getPhone(), bank.getAddress(), bank.getStatus());
    }
}
