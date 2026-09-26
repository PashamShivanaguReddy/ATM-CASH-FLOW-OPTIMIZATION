package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity @Table(name="cash_inventory", uniqueConstraints=@UniqueConstraint(name="uk_inventory_atm_denomination", columnNames={"atm_id", "denomination"}), indexes=@Index(name="idx_inventory_atm_id", columnList="atm_id"))
@Getter @Setter @NoArgsConstructor
public class CashInventory extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="atm_id", nullable=false, foreignKey=@ForeignKey(name="fk_inventory_atm")) @JsonIgnore private ATM atm;
    @NotNull @Positive @Column(nullable=false) private Integer denomination;
    @NotNull @PositiveOrZero @Column(name="note_count", nullable=false) private Integer noteCount;
    @NotNull @PositiveOrZero @Column(name="total_amount", nullable=false, precision=19, scale=2) private BigDecimal totalAmount;
}
