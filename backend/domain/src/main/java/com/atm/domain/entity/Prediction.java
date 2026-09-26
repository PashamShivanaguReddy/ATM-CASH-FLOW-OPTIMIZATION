package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name="predictions", indexes={@Index(name="idx_predictions_atm_id", columnList="atm_id"), @Index(name="idx_predictions_date", columnList="prediction_date")})
@Getter @Setter @NoArgsConstructor
public class Prediction extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="atm_id", nullable=false, foreignKey=@ForeignKey(name="fk_predictions_atm")) @JsonIgnore private ATM atm;
    @NotNull @Column(name="prediction_date", nullable=false) private LocalDate predictionDate;
    @NotNull @PositiveOrZero @Column(name="predicted_demand", nullable=false, precision=19, scale=2) private BigDecimal predictedDemand;
    @DecimalMin("0.0") @DecimalMax("1.0") @Column(name="confidence_score", precision=5, scale=4) private BigDecimal confidenceScore;
    @NotBlank @Size(max=64) @Column(name="model_version", nullable=false, length=64) private String modelVersion;
    @NotNull @Column(name="generated_at", nullable=false) private Instant generatedAt;
}
