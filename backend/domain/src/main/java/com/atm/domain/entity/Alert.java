package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity @Table(name="alerts", indexes={@Index(name="idx_alerts_atm_id", columnList="atm_id"), @Index(name="idx_alerts_status", columnList="status")})
@Getter @Setter @NoArgsConstructor
public class Alert extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="atm_id", nullable=false, foreignKey=@ForeignKey(name="fk_alerts_atm")) @JsonIgnore private ATM atm;
    @Enumerated(EnumType.STRING) @Column(name="alert_type", nullable=false, length=30) private AlertType alertType;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private Severity severity;
    @NotBlank @Size(max=1000) @Column(nullable=false, length=1000) private String message;
    @NotBlank @Size(max=20) @Column(nullable=false, length=20) private String status;
    @Column(name="resolved_at") private Instant resolvedAt;
}
