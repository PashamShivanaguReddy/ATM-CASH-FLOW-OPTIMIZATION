package com.atm.domain.repository;
import com.atm.domain.entity.CashRefill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CashRefillRepository extends JpaRepository<CashRefill, Long> { List<CashRefill> findByAtmId(Long atmId); }
