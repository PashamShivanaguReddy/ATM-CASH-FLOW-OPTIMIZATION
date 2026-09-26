package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name="atm_transactions", uniqueConstraints=@UniqueConstraint(name="uk_transactions_id", columnNames="transaction_id"), indexes={@Index(name="idx_transactions_atm_id", columnList="atm_id"), @Index(name="idx_transactions_timestamp", columnList="timestamp"), @Index(name="idx_transactions_type", columnList="transaction_type")})
@Getter @Setter @NoArgsConstructor
public class ATMTransaction extends BaseEntity {
    @NotBlank @Size(max=64) @Column(name="transaction_id", nullable=false, unique=true, length=64) private String transactionId;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="atm_id", nullable=false, foreignKey=@ForeignKey(name="fk_transactions_atm")) @JsonIgnore private ATM atm;
    @Enumerated(EnumType.STRING) @Column(name="transaction_type", nullable=false, length=20) private TransactionType transactionType;
    @NotNull @PositiveOrZero @Column(nullable=false, precision=19, scale=2) private BigDecimal amount;
    @NotNull @Column(name="timestamp", nullable=false) private Instant timestamp;
    @NotNull @Column(nullable=false) private Boolean success;
    @Size(max=32) @Column(name="card_type", length=32) private String cardType;
}
