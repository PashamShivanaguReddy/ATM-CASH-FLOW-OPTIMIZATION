package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity @Table(name="audit_logs", indexes={@Index(name="idx_audit_user_id", columnList="user_id"), @Index(name="idx_audit_timestamp", columnList="timestamp")})
@Getter @Setter @NoArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id", foreignKey=@ForeignKey(name="fk_audit_user")) @JsonIgnore private User user;
    @NotBlank @Size(max=100) @Column(nullable=false, length=100) private String action;
    @NotBlank @Size(max=100) @Column(name="entity_type", nullable=false, length=100) private String entityType;
    @NotNull @Column(name="entity_id", nullable=false) private Long entityId;
    @Column(name="old_value", columnDefinition="text") private String oldValue;
    @Column(name="new_value", columnDefinition="text") private String newValue;
    @NotNull @Column(name="timestamp", nullable=false) private Instant timestamp;
    @Size(max=45) @Column(name="ip_address", length=45) private String ipAddress;
}
