package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name="cash_refills", indexes=@Index(name="idx_refills_atm_id", columnList="atm_id"))
@Getter @Setter @NoArgsConstructor
public class CashRefill extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="atm_id", nullable=false, foreignKey=@ForeignKey(name="fk_refills_atm")) @JsonIgnore private ATM atm;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="recommendation_id", foreignKey=@ForeignKey(name="fk_refills_recommendation")) @JsonIgnore private OptimizationRecommendation recommendation;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="requested_by", foreignKey=@ForeignKey(name="fk_refills_requested_by")) @JsonIgnore private User requestedBy;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="approved_by", foreignKey=@ForeignKey(name="fk_refills_approved_by")) @JsonIgnore private User approvedBy;
    @NotNull @Positive @Column(name="refill_amount", nullable=false, precision=19, scale=2) private BigDecimal refillAmount;
    @NotNull @Column(name="refill_date", nullable=false) private Instant refillDate;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private RefillStatus status = RefillStatus.REQUESTED;
    @Size(max=1000) @Column(length=1000) private String notes;
}
