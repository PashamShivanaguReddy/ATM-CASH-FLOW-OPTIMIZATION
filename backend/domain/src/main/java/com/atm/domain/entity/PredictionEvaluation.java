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

@Entity
@Table(name = "prediction_evaluations",
        uniqueConstraints = @UniqueConstraint(name = "uk_prediction_evaluation_prediction_id", columnNames = "prediction_id"),
        indexes = {
                @Index(name = "idx_prediction_evaluations_atm_id", columnList = "atm_id"),
                @Index(name = "idx_prediction_evaluations_date", columnList = "prediction_date")
        })
@Getter @Setter @NoArgsConstructor
public class PredictionEvaluation extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prediction_id", nullable = false, foreignKey = @ForeignKey(name = "fk_prediction_evaluation_prediction"))
    @JsonIgnore
    private Prediction prediction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atm_id", nullable = false, foreignKey = @ForeignKey(name = "fk_prediction_evaluation_atm"))
    @JsonIgnore
    private ATM atm;

    @NotNull
    @Column(name = "prediction_date", nullable = false)
    private LocalDate predictionDate;

    @NotBlank
    @Size(max = 64)
    @Column(name = "model_version", nullable = false, length = 64)
    private String modelVersion;

    @NotNull
    @PositiveOrZero
    @Column(name = "actual_demand", nullable = false, precision = 19, scale = 2)
    private BigDecimal actualDemand;

    @NotNull
    @PositiveOrZero
    @Column(name = "predicted_demand", nullable = false, precision = 19, scale = 2)
    private BigDecimal predictedDemand;

    @NotNull
    @PositiveOrZero
    @Column(name = "absolute_error", nullable = false, precision = 19, scale = 2)
    private BigDecimal absoluteError;

    @DecimalMin("0.0")
        @Column(name = "percentage_error", precision = 10, scale = 4)
    private BigDecimal percentageError;

    @NotNull
    @Column(name = "evaluated_at", nullable = false)
    private Instant evaluatedAt;
}
