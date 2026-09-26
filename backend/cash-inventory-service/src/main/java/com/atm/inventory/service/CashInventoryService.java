package com.atm.inventory.service;

import com.atm.common.exception.BusinessRuleException;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.entity.*;
import com.atm.domain.repository.*;
import com.atm.inventory.dto.*;
import com.atm.inventory.exception.InventoryAuthorizationException;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class CashInventoryService {
    private static final Set<Integer> VALID_DENOMINATIONS = Set.of(50, 100, 200, 500, 2000);
    private final ATMRepository atms;
    private final CashInventoryRepository inventory;
    private final CashRefillRepository refills;
    private final AuditLogRepository audits;
    private final UserRepository users;

    public CashInventoryService(ATMRepository atms, CashInventoryRepository inventory, CashRefillRepository refills,
                                AuditLogRepository audits, UserRepository users) {
        this.atms = atms; this.inventory = inventory; this.refills = refills; this.audits = audits; this.users = users;
    }

    @Transactional(readOnly = true)
    public CashInventoryResponse getInventory(Long atmId, Authentication authentication) {
        ATM atm = findAtm(atmId); authorize(atm, authentication);
        return response(atmId, inventory.findByAtmId(atmId));
    }

    @Transactional
    public CashInventoryResponse updateInventory(Long atmId, CashInventoryUpdateRequest request,
                                                 Authentication authentication, String ip) {
        ATM atm = atms.findByIdForUpdate(atmId).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
        authorize(atm, authentication);
        Map<Integer, Integer> requested = validateDenominations(request);
        List<CashInventory> rows = inventory.findByAtmIdForUpdate(atmId);
        BigDecimal oldCash = atm.getCurrentCash();
        Map<Integer, CashInventory> existing = new HashMap<>();
        for (CashInventory row : rows) existing.put(row.getDenomination(), row);
        for (Integer denomination : VALID_DENOMINATIONS) {
            CashInventory row = existing.get(denomination);
            int count = requested.getOrDefault(denomination, 0);
            if (row == null) {
                if (count > 0) { row = new CashInventory(); row.setAtm(atm); row.setDenomination(denomination); existing.put(denomination, row); }
            }
            if (row != null) { row.setNoteCount(count); row.setTotalAmount(BigDecimal.valueOf(denomination).multiply(BigDecimal.valueOf(count))); inventory.save(row); }
        }
        BigDecimal total = requested.entrySet().stream().map(e -> BigDecimal.valueOf(e.getKey()).multiply(BigDecimal.valueOf(e.getValue()))).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(atm.getCashCapacity()) > 0) throw new BusinessRuleException("Cash exceeds ATM capacity", "CASH_EXCEEDS_CAPACITY");
        atm.setCurrentCash(total); updateStatus(atm); atms.save(atm);
        audit(authentication, "CASH_INVENTORY_UPDATED", atm.getId(), oldCash + "->" + total, ip);
        return response(atmId, inventory.findByAtmId(atmId));
    }

    @Transactional
    public RefillResponse requestRefill(RefillRequest request, Authentication authentication, String ip) {
        ATM atm = findAtm(request.atmId()); authorize(atm, authentication);
        requireRole(authentication, "SUPER_ADMIN", "BANK_ADMIN");
        if (atm.getCurrentCash().add(request.refillAmount()).compareTo(atm.getCashCapacity()) > 0)
            throw new BusinessRuleException("Refill exceeds ATM cash capacity", "CASH_EXCEEDS_CAPACITY");
        CashRefill refill = new CashRefill(); refill.setAtm(atm); refill.setRefillAmount(request.refillAmount());
        refill.setRefillDate(Instant.now()); refill.setStatus(RefillStatus.REQUESTED); refill.setNotes(request.notes());
        AtmPrincipal principal = principal(authentication); refill.setRequestedBy(user(principal));
        CashRefill saved = refills.save(refill); audit(authentication, "REFILL_REQUESTED", saved.getId(), request.refillAmount().toPlainString(), ip);
        return response(saved);
    }

    @Transactional(readOnly = true)
    public List<RefillResponse> listRefills(Long atmId, Authentication authentication) {
        if (atmId == null) return refills.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().filter(r -> authorized(r.getAtm(), authentication)).map(this::response).toList();
        ATM atm = findAtm(atmId); authorize(atm, authentication); return refills.findByAtmId(atmId).stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public RefillResponse getRefill(Long id, Authentication authentication) {
        CashRefill refill = refills.findById(id).orElseThrow(() -> new ResourceNotFoundException("Refill not found", "REFILL_NOT_FOUND"));
        authorize(refill.getAtm(), authentication); return response(refill);
    }

    @Transactional
    public RefillResponse approve(Long id, Authentication authentication, String ip) { return transition(id, RefillStatus.APPROVED, authentication, ip, "SUPER_ADMIN", "BANK_MANAGER"); }
    @Transactional
    public RefillResponse reject(Long id, Authentication authentication, String ip) { return transition(id, RefillStatus.REJECTED, authentication, ip, "SUPER_ADMIN", "BANK_MANAGER"); }

    @Transactional
    public RefillResponse complete(Long id, Authentication authentication, String ip) {
        CashRefill refill = refills.findById(id).orElseThrow(() -> new ResourceNotFoundException("Refill not found", "REFILL_NOT_FOUND"));
        authorize(refill.getAtm(), authentication); requireRole(authentication, "SUPER_ADMIN", "ATM_OPERATOR");
        if (refill.getStatus() != RefillStatus.APPROVED) throw new BusinessRuleException("Only approved refills can be completed", "INVALID_REFILL_STATUS");
        ATM atm = atms.findByIdForUpdate(refill.getAtm().getId()).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
        BigDecimal oldCash = atm.getCurrentCash(); BigDecimal newCash = oldCash.add(refill.getRefillAmount());
        if (newCash.compareTo(atm.getCashCapacity()) > 0) throw new BusinessRuleException("Refill exceeds ATM cash capacity", "CASH_EXCEEDS_CAPACITY");
        atm.setCurrentCash(newCash); atm.setLastRefillAt(Instant.now()); updateStatus(atm); atms.save(atm);
        refill.setStatus(RefillStatus.COMPLETED); refill.setRefillDate(Instant.now()); CashRefill saved = refills.save(refill);
        audit(authentication, "REFILL_COMPLETED", saved.getId(), oldCash + "->" + newCash, ip); return response(saved);
    }

    private RefillResponse transition(Long id, RefillStatus target, Authentication authentication, String ip, String... roles) {
        CashRefill refill = refills.findById(id).orElseThrow(() -> new ResourceNotFoundException("Refill not found", "REFILL_NOT_FOUND"));
        authorize(refill.getAtm(), authentication); requireRole(authentication, roles);
        if (refill.getStatus() != RefillStatus.REQUESTED) throw new BusinessRuleException("Only requested refills can change status", "INVALID_REFILL_STATUS");
        if (target == RefillStatus.APPROVED) { AtmPrincipal p = principal(authentication); refill.setApprovedBy(user(p)); }
        refill.setStatus(target); CashRefill saved = refills.save(refill); audit(authentication, "REFILL_" + target, saved.getId(), target.name(), ip); return response(saved);
    }

    private Map<Integer, Integer> validateDenominations(CashInventoryUpdateRequest request) {
        Map<Integer, Integer> values = new HashMap<>();
        for (DenominationRequest item : request.denominations()) {
            if (!VALID_DENOMINATIONS.contains(item.denomination())) throw new BusinessRuleException("Invalid denomination", "INVALID_DENOMINATION");
            if (item.noteCount() == null || item.noteCount() < 0) throw new BusinessRuleException("Note count cannot be negative", "NEGATIVE_NOTE_COUNT");
            if (values.put(item.denomination(), item.noteCount()) != null) throw new BusinessRuleException("Duplicate denomination", "DUPLICATE_DENOMINATION");
        }
        return values;
    }
    private void updateStatus(ATM atm) { atm.setStatus(atm.getCurrentCash().signum() == 0 ? AtmStatus.OUT_OF_SERVICE : atm.getCurrentCash().compareTo(atm.getMinimumCashThreshold()) <= 0 ? AtmStatus.LOW_CASH : AtmStatus.ACTIVE); }
    private ATM findAtm(Long id) { return atms.findById(id).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND")); }
    private CashInventoryResponse response(Long atmId, List<CashInventory> rows) { List<DenominationResponse> values = rows.stream().sorted(Comparator.comparing(CashInventory::getDenomination)).map(r -> new DenominationResponse(r.getDenomination(), r.getNoteCount(), r.getTotalAmount())).toList(); return new CashInventoryResponse(atmId, values, values.stream().map(DenominationResponse::totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add)); }
    private RefillResponse response(CashRefill r) { return new RefillResponse(r.getId(), r.getAtm().getId(), id(r.getRequestedBy()), id(r.getApprovedBy()), r.getRefillAmount(), r.getRefillDate(), r.getStatus(), r.getNotes(), r.getCreatedAt(), r.getUpdatedAt()); }
    private Long id(User user) { return user == null ? null : user.getId(); }
    private User user(AtmPrincipal p) { return p == null || p.userId() == null ? null : users.findById(p.userId()).orElse(null); }
    private void audit(Authentication authentication, String action, Long entityId, String value, String ip) { AuditLog log = new AuditLog(); log.setUser(user(principal(authentication))); log.setAction(action); log.setEntityType("CASH_REFILL"); log.setEntityId(entityId); log.setNewValue(value); log.setTimestamp(Instant.now()); log.setIpAddress(ip); audits.save(log); }
    private void authorize(ATM atm, Authentication authentication) { if (!authorized(atm, authentication)) throw new InventoryAuthorizationException("User is not authorized for this ATM"); }
    private boolean authorized(ATM atm, Authentication authentication) { AtmPrincipal p = principal(authentication); return p != null && ("SUPER_ADMIN".equals(p.role()) || p.bankId() != null && p.bankId().equals(atm.getBank().getId())); }
    private void requireRole(Authentication authentication, String... roles) { AtmPrincipal p = principal(authentication); if (p == null || Arrays.stream(roles).noneMatch(r -> r.equals(p.role()))) throw new InventoryAuthorizationException("User is not authorized for this operation"); }
    private AtmPrincipal principal(Authentication authentication) { return authentication != null && authentication.getPrincipal() instanceof AtmPrincipal p ? p : null; }
}
