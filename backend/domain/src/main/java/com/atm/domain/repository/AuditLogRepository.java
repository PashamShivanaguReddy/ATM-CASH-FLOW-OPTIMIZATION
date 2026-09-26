package com.atm.domain.repository;
import com.atm.domain.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> { List<AuditLog> findByUserIdAndTimestampBetween(Long userId, Instant from, Instant to); }
