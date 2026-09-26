package com.atm.domain.repository;
import com.atm.domain.entity.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface BankRepository extends JpaRepository<Bank, Long> { Optional<Bank> findByBankCode(String bankCode); }
