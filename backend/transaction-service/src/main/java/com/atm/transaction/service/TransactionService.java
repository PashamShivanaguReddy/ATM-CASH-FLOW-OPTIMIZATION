package com.atm.transaction.service;

import com.atm.common.exception.BusinessRuleException;
import com.atm.common.exception.ConflictException;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.entity.*;
import com.atm.domain.repository.ATMRepository;
import com.atm.domain.repository.ATMTransactionRepository;
import com.atm.domain.repository.AuditLogRepository;
import com.atm.domain.repository.UserRepository;
import com.atm.transaction.dto.*;
import com.atm.transaction.event.TransactionEvent;
import com.atm.transaction.exception.TransactionAuthorizationException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class TransactionService {
    private final ATMTransactionRepository transactions;
    private final ATMRepository atms;
    private final AuditLogRepository audits;
    private final UserRepository users;
    private final ApplicationEventPublisher events;

    public TransactionService(ATMTransactionRepository transactions, ATMRepository atms, AuditLogRepository audits,
                              UserRepository users, ApplicationEventPublisher events) {
        this.transactions = transactions; this.atms = atms; this.audits = audits; this.users = users; this.events = events;
    }

    @Transactional
    public TransactionCreateResult create(TransactionCreateRequest request, Authentication authentication, String ip) {
        requireAuthenticated(authentication);
        Instant timestamp = request.timestamp() == null ? Instant.now() : request.timestamp();
        if (request.amount() == null || request.amount().signum() <= 0) throw new BusinessRuleException("Amount must be positive", "INVALID_AMOUNT");
        ATMTransaction existing = transactions.findByTransactionId(request.transactionId()).orElse(null);
        if (existing != null) {
            if (!samePayload(existing, request, timestamp)) throw new ConflictException("Transaction ID already exists with a different payload", "TRANSACTION_ID_CONFLICT");
            authorize(existing.getAtm(), authentication);
            return new TransactionCreateResult(response(existing), false);
        }

        ATM atm = atms.findByIdForUpdate(request.atmId()).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND"));
        authorize(atm, authentication);
        requireOperational(atm);
        if (request.success()) {
            validateCashOperation(atm, request.transactionType(), request.amount());
            applyCashChange(atm, request.transactionType(), request.amount());
            atms.save(atm);
        }

        ATMTransaction transaction = new ATMTransaction();
        transaction.setTransactionId(request.transactionId()); transaction.setAtm(atm); transaction.setTransactionType(request.transactionType());
        transaction.setAmount(request.amount()); transaction.setTimestamp(timestamp); transaction.setSuccess(request.success()); transaction.setCardType(request.cardType());
        ATMTransaction saved = transactions.save(transaction);
        audit(authentication, saved, request.success() ? "TRANSACTION_COMPLETED" : "TRANSACTION_FAILED", ip);
        events.publishEvent(new TransactionEvent("TRANSACTION_CREATED", saved.getId(), atm.getId(),
                saved.getTransactionType(), saved.getAmount(), atm.getCurrentCash(), Instant.now()));
        if (request.success() && (request.transactionType() == TransactionType.WITHDRAWAL || request.transactionType() == TransactionType.DEPOSIT)) {
            events.publishEvent(new TransactionEvent("CASH_UPDATED", saved.getId(), atm.getId(), saved.getTransactionType(), saved.getAmount(), atm.getCurrentCash(), Instant.now()));
            if (atm.getStatus() == AtmStatus.LOW_CASH) events.publishEvent(new TransactionEvent("LOW_CASH_DETECTED", saved.getId(), atm.getId(), saved.getTransactionType(), saved.getAmount(), atm.getCurrentCash(), Instant.now()));
        }
        return new TransactionCreateResult(response(saved), true);
    }

    @Transactional(readOnly = true)
    public TransactionResponse get(Long id, Authentication authentication) {
        ATMTransaction transaction = transactions.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transaction not found", "TRANSACTION_NOT_FOUND"));
        authorize(transaction.getAtm(), authentication); return response(transaction);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getByTransactionId(String transactionId, Authentication authentication) {
        ATMTransaction transaction = transactions.findByTransactionId(transactionId).orElseThrow(() -> new ResourceNotFoundException("Transaction not found", "TRANSACTION_NOT_FOUND"));
        authorize(transaction.getAtm(), authentication); return response(transaction);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> search(Long atmId, Instant from, Instant to, TransactionType type, Boolean success,
                                            Pageable pageable, Authentication authentication) {
        AtmPrincipal principal = principal(authentication); requireAuthenticated(authentication);
        Long bankId = "SUPER_ADMIN".equals(principal.role()) ? null : requireBank(principal);
        if (atmId != null) authorize(atms.findById(atmId).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND")), authentication);
        Specification<ATMTransaction> specification = (root, query, criteria) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (bankId != null) predicates.add(criteria.equal(root.get("atm").get("bank").get("id"), bankId));
            if (atmId != null) predicates.add(criteria.equal(root.get("atm").get("id"), atmId));
            if (from != null) predicates.add(criteria.greaterThanOrEqualTo(root.get("timestamp"), from));
            if (to != null) predicates.add(criteria.lessThanOrEqualTo(root.get("timestamp"), to));
            if (type != null) predicates.add(criteria.equal(root.get("transactionType"), type));
            if (success != null) predicates.add(criteria.equal(root.get("success"), success));
            return criteria.and(predicates.toArray(Predicate[]::new));
        };
        return transactions.findAll(specification, pageable).map(this::response);
    }

    @Transactional(readOnly = true)
    public TransactionSummaryResponse summary(Long atmId, Instant from, Instant to, Authentication authentication) {
        authorize(atmId, authentication);
        BigDecimal withdrawals = transactions.sumSuccessfulAmount(atmId, TransactionType.WITHDRAWAL, from, to);
        BigDecimal deposits = transactions.sumSuccessfulAmount(atmId, TransactionType.DEPOSIT, from, to);
        return new TransactionSummaryResponse(transactions.countSuccessful(atmId, from, to), withdrawals, deposits,
                transactions.averageSuccessfulAmount(atmId, TransactionType.WITHDRAWAL, from, to),
            transactions.maximumSuccessfulAmount(atmId, TransactionType.WITHDRAWAL, from, to), peakHour(atmId, from, to));
    }

    @Transactional(readOnly = true)
    public List<TimeAmountResponse> dailySummary(Long atmId, Instant from, Instant to, Authentication authentication) {
        List<ATMTransaction> rows = rows(atmId, from, to, authentication);
        return rows.stream().filter(t -> t.getSuccess() && t.getTransactionType() == TransactionType.WITHDRAWAL)
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getTimestamp().atZone(ZoneOffset.UTC).toLocalDate(), java.util.TreeMap::new, java.util.stream.Collectors.toList()))
                .entrySet().stream().map(e -> TimeAmountResponse.daily(e.getKey(), sum(e.getValue()), e.getValue().size())).toList();
    }

    @Transactional(readOnly = true)
    public List<TimeAmountResponse> monthlySummary(Long atmId, Instant from, Instant to, Authentication authentication) {
        List<ATMTransaction> rows = rows(atmId, from, to, authentication);
        return rows.stream().filter(t -> t.getSuccess() && t.getTransactionType() == TransactionType.WITHDRAWAL)
                .collect(java.util.stream.Collectors.groupingBy(t -> YearMonth.from(t.getTimestamp().atZone(ZoneOffset.UTC)), java.util.TreeMap::new, java.util.stream.Collectors.toList()))
                .entrySet().stream().map(e -> TimeAmountResponse.monthly(e.getKey(), sum(e.getValue()), e.getValue().size())).toList();
    }

    @Transactional(readOnly = true)
    public List<TimeAmountResponse> hourlySummary(Long atmId, Instant from, Instant to, Authentication authentication) {
        List<ATMTransaction> rows = rows(atmId, from, to, authentication);
        return rows.stream().filter(ATMTransaction::getSuccess)
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getTimestamp().atZone(ZoneOffset.UTC).getHour(), java.util.TreeMap::new, java.util.stream.Collectors.toList()))
                .entrySet().stream().map(e -> new TimeAmountResponse(String.valueOf(e.getKey()), BigDecimal.ZERO, e.getValue().size())).toList();
    }

    private List<ATMTransaction> rows(Long atmId, Instant from, Instant to, Authentication authentication) {
        authorize(atmId, authentication);
        return transactions.findByAtmIdAndTimestampBetween(atmId, from, to);
    }
    private int peakHour(Long atmId, Instant from, Instant to) { return transactions.findByAtmIdAndTimestampBetween(atmId, from, to).stream().filter(ATMTransaction::getSuccess).collect(java.util.stream.Collectors.groupingBy(t -> t.getTimestamp().atZone(ZoneOffset.UTC).getHour(), java.util.stream.Collectors.counting())).entrySet().stream().max(java.util.Map.Entry.comparingByValue()).map(java.util.Map.Entry::getKey).orElse(-1); }
    private BigDecimal sum(List<ATMTransaction> values) { return values.stream().map(ATMTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add); }

    private void validateCashOperation(ATM atm, TransactionType type, BigDecimal amount) {
        if ((type == TransactionType.WITHDRAWAL || type == TransactionType.DEPOSIT)
                && amount.remainder(BigDecimal.valueOf(50)).compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessRuleException("Amount must be a multiple of the smallest supported denomination", "UNSUPPORTED_CASH_DENOMINATION");
        }
        if (type == TransactionType.WITHDRAWAL && atm.getCurrentCash().compareTo(amount) < 0) throw new BusinessRuleException("Insufficient ATM cash", "INSUFFICIENT_CASH");
        if (type == TransactionType.DEPOSIT && atm.getCurrentCash().add(amount).compareTo(atm.getCashCapacity()) > 0) throw new BusinessRuleException("Deposit exceeds ATM capacity", "CASH_EXCEEDS_CAPACITY");
    }
    private void applyCashChange(ATM atm, TransactionType type, BigDecimal amount) {
        if (type == TransactionType.WITHDRAWAL) atm.setCurrentCash(atm.getCurrentCash().subtract(amount));
        if (type == TransactionType.DEPOSIT) atm.setCurrentCash(atm.getCurrentCash().add(amount));
        if (atm.getCurrentCash().signum() < 0) throw new BusinessRuleException("ATM cash cannot be negative", "NEGATIVE_CASH");
        atm.setStatus(atm.getCurrentCash().signum() == 0 ? AtmStatus.OUT_OF_SERVICE : atm.getCurrentCash().compareTo(atm.getMinimumCashThreshold()) <= 0 ? AtmStatus.LOW_CASH : AtmStatus.ACTIVE);
    }
    private boolean samePayload(ATMTransaction existing, TransactionCreateRequest request, Instant timestamp) { return existing.getAtm().getId().equals(request.atmId()) && existing.getTransactionType() == request.transactionType() && existing.getAmount().compareTo(request.amount()) == 0 && existing.getTimestamp().equals(timestamp) && existing.getSuccess().equals(request.success()) && java.util.Objects.equals(existing.getCardType(), request.cardType()); }
    private void audit(Authentication authentication, ATMTransaction transaction, String action, String ip) { AuditLog log = new AuditLog(); AtmPrincipal p = principal(authentication); if (p != null && p.userId() != null) log.setUser(users.findById(p.userId()).orElse(null)); log.setAction(action); log.setEntityType("ATM_TRANSACTION"); log.setEntityId(transaction.getId()); log.setNewValue(transaction.getTransactionId() + ":" + transaction.getAmount()); log.setTimestamp(Instant.now()); log.setIpAddress(ip); audits.save(log); }
    private TransactionResponse response(ATMTransaction t) { return new TransactionResponse(t.getId(), t.getTransactionId(), t.getAtm().getId(), t.getTransactionType(), t.getAmount(), t.getTimestamp(), t.getSuccess(), t.getCardType(), t.getCreatedAt()); }
    private void authorize(Long atmId, Authentication authentication) { authorize(atms.findById(atmId).orElseThrow(() -> new ResourceNotFoundException("ATM not found", "ATM_NOT_FOUND")), authentication); }
    private void authorize(ATM atm, Authentication authentication) { AtmPrincipal p = principal(authentication); requireAuthenticated(authentication); if (!"SUPER_ADMIN".equals(p.role()) && (p.bankId() == null || !p.bankId().equals(atm.getBank().getId()))) throw new TransactionAuthorizationException("User is not authorized for this ATM"); }
    private Long requireBank(AtmPrincipal p) { if (p.bankId() == null) throw new TransactionAuthorizationException("User is not assigned to a bank"); return p.bankId(); }
    private void requireOperational(ATM atm) { if (atm.getStatus() != AtmStatus.ACTIVE && atm.getStatus() != AtmStatus.LOW_CASH) throw new BusinessRuleException("ATM is not active and operational", "ATM_NOT_OPERATIONAL"); }
    private void requireAuthenticated(Authentication authentication) { if (principal(authentication) == null) throw new TransactionAuthorizationException("Authentication required"); }
    private AtmPrincipal principal(Authentication authentication) { return authentication != null && authentication.getPrincipal() instanceof AtmPrincipal p ? p : null; }
}
