package com.atm.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "banks", indexes = @Index(name = "idx_banks_code", columnList = "bank_code"))
@Getter @Setter @NoArgsConstructor
public class Bank extends BaseEntity {
    @NotBlank @Size(max = 32) @Column(name="bank_code", nullable=false, unique=true, length=32)
    private String bankCode;
    @NotBlank @Size(max = 160) @Column(nullable=false, length=160) private String name;
    @Email @Size(max = 254) @Column(length=254) private String email;
    @Size(max = 32) @Column(length=32) private String phone;
    @Size(max = 500) @Column(length=500) private String address;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private BankStatus status = BankStatus.ACTIVE;
    @JsonIgnore @OneToMany(mappedBy="bank", fetch=FetchType.LAZY) private List<User> users = new ArrayList<>();
    @JsonIgnore @OneToMany(mappedBy="bank", fetch=FetchType.LAZY) private List<ATM> atms = new ArrayList<>();
}
