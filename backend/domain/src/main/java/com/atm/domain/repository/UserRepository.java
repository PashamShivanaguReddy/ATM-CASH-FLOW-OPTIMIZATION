package com.atm.domain.repository;
import com.atm.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import com.atm.domain.entity.UserRole;
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long countByRole(UserRole role);
}
