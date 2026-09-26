package com.atm.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version
    private long version;
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}
