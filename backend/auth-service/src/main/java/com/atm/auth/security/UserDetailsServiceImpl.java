package com.atm.auth.security;

import com.atm.domain.repository.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository users;
    public UserDetailsServiceImpl(UserRepository users) { this.users = users; }
    @Override public UserDetails loadUserByUsername(String email) {
        var user = users.findByEmail(email.toLowerCase()).orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
        boolean enabled = user.getStatus() == com.atm.domain.entity.UserStatus.ACTIVE;
        return User.withUsername(user.getEmail()).password(user.getPasswordHash()).roles(user.getRole().name()).disabled(!enabled).build();
    }
}
