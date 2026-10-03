package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.time.LocalDate;
import java.util.List;

@Entity @Table(name="optimization_recommendations", indexes=@Index(name="idx_recommendations_atm_id", columnList="atm_id"))
@Getter @Setter @NoArgsConstructor
public class OptimizationRecommendation extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="atm_id", nullable=false, foreignKey=@ForeignKey(name="fk_recommendations_atm")) @JsonIgnore private ATM atm;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="prediction_id", foreignKey=@ForeignKey(name="fk_recommendations_prediction")) @JsonIgnore private Prediction prediction;
    @OneToMany(mappedBy="recommendation", fetch=FetchType.LAZY) @JsonIgnore private List<CashRefill> refills = new ArrayList<>();
    @NotNull @PositiveOrZero @Column(name="current_cash", nullable=false, precision=19, scale=2) private BigDecimal currentCash;
    @NotNull @PositiveOrZero @Column(name="predicted_demand", nullable=false, precision=19, scale=2) private BigDecimal predictedDemand;
    @NotNull @PositiveOrZero @Column(name="safety_reserve", nullable=false, precision=19, scale=2) private BigDecimal safetyReserve;
    @NotNull @PositiveOrZero @Column(name="recommended_refill_amount", nullable=false, precision=19, scale=2) private BigDecimal recommendedRefillAmount;
    @NotNull @Column(name="recommended_refill_date", nullable=false) private LocalDate recommendedRefillDate;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private RecommendationPriority priority;
    @NotBlank @Size(max=1000) @Column(nullable=false, length=1000) private String reason;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private RecommendationStatus status = RecommendationStatus.PENDING;
}
