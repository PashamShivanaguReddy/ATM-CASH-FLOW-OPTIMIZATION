package com.atm.analytics.repository;

import com.atm.domain.entity.Alert;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.domain.Specification;

public interface DashboardAlertRepository extends JpaRepository<Alert, Long>, JpaSpecificationExecutor<Alert> {
    @Query("select a.atm.id, max(case a.severity when com.atm.domain.entity.Severity.LOW then 1 when com.atm.domain.entity.Severity.MEDIUM then 2 when com.atm.domain.entity.Severity.HIGH then 3 when com.atm.domain.entity.Severity.CRITICAL then 4 else 0 end) from Alert a where a.atm.id in :atmIds and a.status in ('ACTIVE', 'ACKNOWLEDGED') group by a.atm.id")
    List<Object[]> findActiveRiskRanksByAtmIds(@Param("atmIds") Collection<Long> atmIds);

    default Page<Alert> search(Long bankId, Long atmId, Instant from, Instant to, String status, Pageable pageable) {
        Specification<Alert> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (bankId != null) predicates.add(builder.equal(root.get("atm").get("bank").get("id"), bankId));
            if (atmId != null) predicates.add(builder.equal(root.get("atm").get("id"), atmId));
            if (from != null) predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null) predicates.add(builder.lessThan(root.get("createdAt"), to));
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        return findAll(specification, pageable);
    }

    @Query("select count(a) from Alert a where a.status in ('ACTIVE', 'ACKNOWLEDGED') and (:bankId is null or a.atm.bank.id = :bankId)")
    long countOpen(@Param("bankId") Long bankId);
}
