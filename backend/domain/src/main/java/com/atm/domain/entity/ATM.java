package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name="atms", indexes={@Index(name="idx_atms_code", columnList="atm_code"), @Index(name="idx_atms_bank_id", columnList="bank_id")})
@Getter @Setter @NoArgsConstructor
public class ATM extends BaseEntity {
    @NotBlank @Size(max=32) @Column(name="atm_code", nullable=false, unique=true, length=32) private String atmCode;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="bank_id", nullable=false, foreignKey=@ForeignKey(name="fk_atms_bank")) @JsonIgnore private Bank bank;
    @NotBlank @Size(max=500) @Column(nullable=false, length=500) private String location;
    @NotBlank @Size(max=100) @Column(nullable=false, length=100) private String city;
    @NotBlank @Size(max=100) @Column(nullable=false, length=100) private String state;
    @DecimalMin("-90.0") @DecimalMax("90.0") @Column(precision=9, scale=6) private BigDecimal latitude;
    @DecimalMin("-180.0") @DecimalMax("180.0") @Column(precision=9, scale=6) private BigDecimal longitude;
    @Enumerated(EnumType.STRING) @Column(name="atm_type", nullable=false, length=20) private AtmType atmType;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private AtmStatus status = AtmStatus.ACTIVE;
    @NotNull @PositiveOrZero @Column(name="cash_capacity", nullable=false, precision=19, scale=2) private BigDecimal cashCapacity;
    @NotNull @PositiveOrZero @Column(name="minimum_cash_threshold", nullable=false, precision=19, scale=2) private BigDecimal minimumCashThreshold;
    @NotNull @PositiveOrZero @Column(name="maximum_cash_threshold", nullable=false, precision=19, scale=2) private BigDecimal maximumCashThreshold;
    @NotNull @PositiveOrZero @Column(name="current_cash", nullable=false, precision=19, scale=2) private BigDecimal currentCash;
    @Column(name="last_refill_at") private Instant lastRefillAt;
    @JsonIgnore @OneToMany(mappedBy="atm", fetch=FetchType.LAZY) private List<ATMTransaction> transactions = new ArrayList<>();
    @JsonIgnore @OneToMany(mappedBy="atm", fetch=FetchType.LAZY) private List<CashInventory> inventory = new ArrayList<>();
    @JsonIgnore @OneToMany(mappedBy="atm", fetch=FetchType.LAZY) private List<CashRefill> refills = new ArrayList<>();
}
