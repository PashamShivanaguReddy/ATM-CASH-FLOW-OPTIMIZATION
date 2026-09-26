package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(name="users", uniqueConstraints=@UniqueConstraint(name="uk_users_email", columnNames="email"), indexes=@Index(name="idx_users_bank_id", columnList="bank_id"))
@Getter @Setter @NoArgsConstructor
public class User extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=true) @JoinColumn(name="bank_id", foreignKey=@ForeignKey(name="fk_users_bank")) @JsonIgnore private Bank bank;
    @NotBlank @Size(max=100) @Column(name="first_name", nullable=false, length=100) private String firstName;
    @NotBlank @Size(max=100) @Column(name="last_name", nullable=false, length=100) private String lastName;
    @NotBlank @Email @Size(max=254) @Column(nullable=false, length=254) private String email;
    @Size(max=32) @Column(length=32) private String phone;
    @NotBlank @Size(max=255) @Column(name="password_hash", nullable=false, length=255) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private UserRole role;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private UserStatus status = UserStatus.ACTIVE;
}
