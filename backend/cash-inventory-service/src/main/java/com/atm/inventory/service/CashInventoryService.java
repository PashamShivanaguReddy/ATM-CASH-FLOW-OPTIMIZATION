package com.atm.inventory.service;

import com.atm.common.exception.BusinessRuleException;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.common.event.EventType;
import com.atm.common.event.KafkaEventPublisher;
import com.atm.domain.entity.*;
import com.atm.domain.repository.*;
import com.atm.inventory.dto.*;
import com.atm.inventory.exception.InventoryAuthorizationException;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class CashInventoryService {
    private static final Set<Integer> VALID_DENOMINATIONS = Set.of(50, 100, 200, 500, 2000);
    private final ATMRepository atms;
    private final CashInventoryRepository inventory;
    private final CashRefillRepository refills;
    private final OptimizationRecommendationRepository recommendations;
    private final KafkaEventPublisher eventPublisher;
    private final AuditLogRepository audits;
    private final UserRepository users;

    public CashInventoryService(ATMRepository atms, CashInventoryRepository inventory, CashRefillRepository refills,
                                AuditLogRepository audits, UserRepository users) {
        this(atms, inventory, refills, null, audits, users, null);
    }

    public CashInventoryService(ATMRepository atms, CashInventoryRepository inventory, CashRefillRepository refills,
                                OptimizationRecommendationRepository recommendations,
                                AuditLogRepository audits, UserRepository users) {
        this(atms, inventory, refills, recommendations, audits, users, null);
    }

    @Autowired
    public CashInventoryService(ATMRepository atms, CashInventoryRepository inventory, CashRefillRepository refills,
                                OptimizationRecommendationRepository recommendations,
                                AuditLogRepository audits, UserRepository users, KafkaEventPublisher eventPublisher) {
        this.atms = atms; this.inventory = inventory; this.refills = refills; this.recommendations = recommendations;
        this.eventPublisher = eventPublisher; this.audits = audits; this.users = users;
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
        BigDecimal oldCash = atm.getCurrentCash();
        BigDecimal total = syncDenominations(atm, requested);
        if (total.compareTo(atm.getCashCapacity()) > 0) throw new BusinessRuleException("Cash exceeds ATM capacity", "CASH_EXCEEDS_CAPACITY");
        atm.setCurrentCash(total); updateStatus(atm); atms.save(atm);
        audit(authentication, "CASH_INVENTORY_UPDATED", atm.getId(), oldCash + "->" + total, ip);
        return response(atmId, inventory.findByAtmId(atmId));
    }

    @Transactional
    public void reconcileInventoryToAtmCash(Long atmId) {
        ATM atm = atms.findByIdForUpdate(atmId)
                .orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
        Map<Integer, Integer> denominations = denominationCountsForCash(atm.getCurrentCash());
        BigDecimal inventoryTotal = syncDenominations(atm, denominations);
        if (inventoryTotal.compareTo(atm.getCurrentCash()) != 0) {
            throw new BusinessRuleException("Denomination inventory does not match ATM cash", "CASH_INVENTORY_MISMATCH");
        }
    }

    @Transactional
    public RefillResponse requestRefill(RefillRequest request, Authentication authentication, String ip) {
        ATM atm = findAtm(request.atmId()); authorize(atm, authentication);
        requireRole(authentication, "SUPER_ADMIN", "BANK_ADMIN");
        if (request.recommendationId() != null) {
            if (recommendations == null) throw new BusinessRuleException("Recommendation linkage is not configured", "RECOMMENDATION_NOT_CONFIGURED");
            OptimizationRecommendation recommendation = recommendations.findById(request.recommendationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found", "RECOMMENDATION_NOT_FOUND"));
            if (!recommendation.getAtm().getId().equals(atm.getId())) throw new BusinessRuleException("Recommendation does not belong to ATM", "RECOMMENDATION_ATM_MISMATCH");
            if (recommendation.getStatus() != RecommendationStatus.APPROVED) throw new BusinessRuleException("Only approved recommendations can create refill requests", "INVALID_RECOMMENDATION_STATUS");
            if (refills.existsByRecommendationId(request.recommendationId())) throw new BusinessRuleException("Refill request already exists for this recommendation", "DUPLICATE_REFILL_REQUEST");
            if (atm.getCurrentCash().add(request.refillAmount()).compareTo(atm.getCashCapacity()) > 0)
                throw new BusinessRuleException("Refill exceeds ATM cash capacity", "CASH_EXCEEDS_CAPACITY");
        }
        if (atm.getCurrentCash().add(request.refillAmount()).compareTo(atm.getCashCapacity()) > 0)
            throw new BusinessRuleException("Refill exceeds ATM cash capacity", "CASH_EXCEEDS_CAPACITY");
        if (request.refillAmount().remainder(BigDecimal.valueOf(50)).compareTo(BigDecimal.ZERO) != 0)
            throw new BusinessRuleException("Refill amount must match supported denominations", "UNSUPPORTED_CASH_DENOMINATION");
        CashRefill refill = new CashRefill(); refill.setAtm(atm); refill.setRefillAmount(request.refillAmount());
        refill.setRefillDate(Instant.now()); refill.setStatus(RefillStatus.REQUESTED); refill.setNotes(request.notes());
        if (request.recommendationId() != null && recommendations != null) {
            refill.setRecommendation(recommendations.findById(request.recommendationId()).orElseThrow(() -> new ResourceNotFoundException("Recommendation not found", "RECOMMENDATION_NOT_FOUND")));
        }
        AtmPrincipal principal = principal(authentication); refill.setRequestedBy(user(principal));
        CashRefill saved = refills.save(refill); audit(authentication, "REFILL_REQUESTED", saved.getId(), request.refillAmount().toPlainString(), ip);
        publishRefillEvent(EventType.REFILL_REQUESTED, saved);
        return response(saved);
    }

    @Transactional
    public void createRefillFromApprovedRecommendation(Long recommendationId) {
        if (recommendations == null) throw new BusinessRuleException("Recommendation linkage is not configured", "RECOMMENDATION_NOT_CONFIGURED");
        if (refills.existsByRecommendationId(recommendationId)) return;
        OptimizationRecommendation recommendation = recommendations.findById(recommendationId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found", "RECOMMENDATION_NOT_FOUND"));
        if (recommendation.getStatus() != RecommendationStatus.APPROVED) return;
        BigDecimal amount = recommendation.getRecommendedRefillAmount();
        if (amount == null || amount.signum() <= 0) return;
        ATM atm = atms.findByIdForUpdate(recommendation.getAtm().getId())
                .orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
        if (atm.getCurrentCash().add(amount).compareTo(atm.getCashCapacity()) > 0) {
            throw new BusinessRuleException("Refill exceeds ATM cash capacity", "CASH_EXCEEDS_CAPACITY");
        }
        CashRefill refill = new CashRefill();
        refill.setAtm(atm);
        refill.setRecommendation(recommendation);
        refill.setRefillAmount(amount);
        refill.setRefillDate(Instant.now());
        refill.setStatus(RefillStatus.REQUESTED);
        refill.setNotes("Generated from approved optimization recommendation " + recommendationId);
        CashRefill saved = refills.save(refill);
        publishRefillEvent(EventType.REFILL_REQUESTED, saved);
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
        Map<Integer, Integer> denoms = denominationCountsForCash(newCash);
        syncDenominations(atm, denoms);
        atm.setCurrentCash(newCash); atm.setLastRefillAt(Instant.now()); updateStatus(atm); atms.save(atm);
        refill.setStatus(RefillStatus.COMPLETED); refill.setRefillDate(Instant.now()); CashRefill saved = refills.save(refill);
        if (saved.getRecommendation() != null && recommendations != null) {
            OptimizationRecommendation recommendation = saved.getRecommendation();
            recommendation.setStatus(RecommendationStatus.COMPLETED);
            recommendations.save(recommendation);
        }
        publishRefillEvent(EventType.REFILL_COMPLETED, saved);
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

    private BigDecimal syncDenominations(ATM atm, Map<Integer, Integer> requested) {
        List<CashInventory> rows = inventory.findByAtmIdForUpdate(atm.getId());
        Map<Integer, CashInventory> existing = new HashMap<>();
        for (CashInventory row : rows) existing.put(row.getDenomination(), row);
        for (Integer denomination : VALID_DENOMINATIONS) {
            CashInventory row = existing.get(denomination);
            int count = requested.getOrDefault(denomination, 0);
            if (row == null) {
                if (count <= 0) continue;
                row = new CashInventory();
                row.setAtm(atm);
                row.setDenomination(denomination);
                existing.put(denomination, row);
            }
            row.setNoteCount(count);
            row.setTotalAmount(BigDecimal.valueOf(denomination).multiply(BigDecimal.valueOf(count)));
            inventory.save(row);
        }
        return requested.entrySet().stream()
                .filter(entry -> VALID_DENOMINATIONS.contains(entry.getKey()))
                .map(entry -> BigDecimal.valueOf(entry.getKey()).multiply(BigDecimal.valueOf(entry.getValue())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<Integer, Integer> denominationCountsForCash(BigDecimal targetCash) {
        BigDecimal remaining = targetCash.setScale(2, java.math.RoundingMode.HALF_UP);
        Map<Integer, Integer> counts = new HashMap<>();
        for (Integer denomination : VALID_DENOMINATIONS.stream().sorted(Comparator.reverseOrder()).toList()) {
            BigDecimal denominationValue = BigDecimal.valueOf(denomination);
            int count = remaining.divide(denominationValue, 0, java.math.RoundingMode.FLOOR).intValue();
            counts.put(denomination, count);
            remaining = remaining.subtract(denominationValue.multiply(BigDecimal.valueOf(count)));
        }
        if (remaining.compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessRuleException("ATM cash cannot be represented with supported denominations", "UNREPRESENTABLE_CASH");
        }
        return counts;
    }

    private void updateStatus(ATM atm) { atm.setStatus(atm.getCurrentCash().signum() == 0 ? AtmStatus.OUT_OF_SERVICE : atm.getCurrentCash().compareTo(atm.getMinimumCashThreshold()) <= 0 ? AtmStatus.LOW_CASH : AtmStatus.ACTIVE); }
    private ATM findAtm(Long id) { return atms.findById(id).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND")); }
    private CashInventoryResponse response(Long atmId, List<CashInventory> rows) { List<DenominationResponse> values = rows.stream().sorted(Comparator.comparing(CashInventory::getDenomination)).map(r -> new DenominationResponse(r.getDenomination(), r.getNoteCount(), r.getTotalAmount())).toList(); return new CashInventoryResponse(atmId, values, values.stream().map(DenominationResponse::totalAmount).reduce(BigDecimal.ZERO, BigDecimal::add)); }
    private RefillResponse response(CashRefill r) {
        return new RefillResponse(r.getId(), r.getAtm().getId(), id(r.getRequestedBy()), id(r.getApprovedBy()),
                r.getRefillAmount(), r.getRefillDate(), r.getStatus(), r.getNotes(),
                r.getRecommendation() == null ? null : r.getRecommendation().getId(), r.getCreatedAt(), r.getUpdatedAt());
    }
    private Long id(User user) { return user == null ? null : user.getId(); }
    private User user(AtmPrincipal p) { return p == null || p.userId() == null ? null : users.findById(p.userId()).orElse(null); }
    private void audit(Authentication authentication, String action, Long entityId, String value, String ip) { AuditLog log = new AuditLog(); log.setUser(user(principal(authentication))); log.setAction(action); log.setEntityType("CASH_REFILL"); log.setEntityId(entityId); log.setNewValue(value); log.setTimestamp(Instant.now()); log.setIpAddress(ip); audits.save(log); }
    private void publishRefillEvent(EventType type, CashRefill refill) {
        if (eventPublisher == null) return;
        Map<String, Object> payload = Map.of(
                "refillId", refill.getId(),
                "atmId", refill.getAtm().getId(),
                "recommendationId", refill.getRecommendation() == null ? 0L : refill.getRecommendation().getId(),
                "amount", refill.getRefillAmount(),
                "status", refill.getStatus());
        Runnable publish = () -> eventPublisher.publish(type, payload);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            publish.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() { publish.run(); }
        });
    }
    private void authorize(ATM atm, Authentication authentication) { if (!authorized(atm, authentication)) throw new InventoryAuthorizationException("User is not authorized for this ATM"); }
    private boolean authorized(ATM atm, Authentication authentication) { AtmPrincipal p = principal(authentication); return p != null && ("SUPER_ADMIN".equals(p.role()) || p.bankId() != null && p.bankId().equals(atm.getBank().getId())); }
    private void requireRole(Authentication authentication, String... roles) { AtmPrincipal p = principal(authentication); if (p == null || Arrays.stream(roles).noneMatch(r -> r.equals(p.role()))) throw new InventoryAuthorizationException("User is not authorized for this operation"); }
    private AtmPrincipal principal(Authentication authentication) { return authentication != null && authentication.getPrincipal() instanceof AtmPrincipal p ? p : null; }
}
