package com.atm.user.service;

import com.atm.common.exception.ConflictException;
import com.atm.common.exception.ResourceNotFoundException;
import com.atm.domain.dto.UserDto;
import com.atm.domain.entity.Bank;
import com.atm.domain.entity.User;
import com.atm.domain.entity.UserRole;
import com.atm.domain.entity.UserStatus;
import com.atm.domain.repository.BankRepository;
import com.atm.domain.repository.UserRepository;
import com.atm.user.dto.UserCreateRequest;
import com.atm.user.dto.UserUpdateRequest;
import com.atm.user.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UserManagementService {
    private final UserRepository users;
    private final BankRepository banks;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserRepository users, BankRepository banks, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.banks = banks;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<UserDto> list(int page, int pageSize, String search, UserRole role, UserStatus status,
                              Long bankId, Authentication authentication) {
        Long scopedBankId = isBankAdmin(authentication) ? requireBankId(authentication) : bankId;
        Specification<User> specification = (root, query, builder) -> builder.conjunction();
        if (scopedBankId != null) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("bank").get("id"), scopedBankId));
        }
        if (role != null) specification = specification.and((root, query, builder) -> builder.equal(root.get("role"), role));
        if (status != null) specification = specification.and((root, query, builder) -> builder.equal(root.get("status"), status));
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, builder) -> builder.or(
                    builder.like(builder.lower(root.get("firstName")), pattern),
                    builder.like(builder.lower(root.get("lastName")), pattern),
                    builder.like(builder.lower(root.get("email")), pattern)));
        }
        return users.findAll(specification, PageRequest.of(page, pageSize, Sort.by("lastName").ascending()))
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public UserDto get(long id, Authentication authentication) {
        return toDto(findManagedUser(id, authentication));
    }

    @Transactional
    public UserDto create(UserCreateRequest request, Authentication authentication) {
        String email = normalizeEmail(request.email());
        if (users.findByEmail(email).isPresent()) throw new ConflictException("Email already registered", "EMAIL_EXISTS");
        ensureRoleAssignable(request.role(), authentication);

        User user = new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRole(request.role());
        user.setStatus(request.status());
        user.setBank(resolveBank(request.bankId(), authentication));
        return toDto(users.save(user));
    }

    @Transactional
    public UserDto update(long id, UserUpdateRequest request, Authentication authentication) {
        User user = findManagedUser(id, authentication);
        String email = normalizeEmail(request.email());
        users.findByEmail(email).filter(existing -> !existing.getId().equals(id)).ifPresent(existing -> {
            throw new ConflictException("Email already registered", "EMAIL_EXISTS");
        });
        ensureRoleAssignable(request.role(), authentication);

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPhone(request.phone());
        user.setRole(request.role());
        user.setStatus(request.status());
        user.setBank(resolveBank(request.bankId(), authentication));
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return toDto(users.save(user));
    }

    @Transactional
    public void delete(long id, Authentication authentication) {
        User user = findManagedUser(id, authentication);
        UserPrincipal principal = principal(authentication);
        if (principal.userId() != null && principal.userId().equals(id)) {
            throw new AccessDeniedException("You cannot deactivate your own account");
        }
        user.setStatus(UserStatus.INACTIVE);
        users.save(user);
    }

    private User findManagedUser(long id, Authentication authentication) {
        User user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found", "USER_NOT_FOUND"));
        if (isBankAdmin(authentication)) {
            Long callerBankId = requireBankId(authentication);
            if (user.getBank() == null || !callerBankId.equals(user.getBank().getId()) || user.getRole() == UserRole.SUPER_ADMIN) {
                throw new AccessDeniedException("Not authorized to manage this user");
            }
        }
        return user;
    }

    private Bank resolveBank(Long bankId, Authentication authentication) {
        if (isBankAdmin(authentication)) {
            Long callerBankId = requireBankId(authentication);
            if (bankId != null && !callerBankId.equals(bankId)) throw new AccessDeniedException("Not authorized for this bank");
            bankId = callerBankId;
        }
        if (bankId == null) return null;
        return banks.findById(bankId).orElseThrow(() -> new ResourceNotFoundException("Bank not found", "BANK_NOT_FOUND"));
    }

    private void ensureRoleAssignable(UserRole role, Authentication authentication) {
        if (role == UserRole.SUPER_ADMIN && !isSuperAdmin(authentication)) {
            throw new AccessDeniedException("Only a super admin can assign the SUPER_ADMIN role");
        }
    }

    private boolean isSuperAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(authority -> "ROLE_SUPER_ADMIN".equals(authority.getAuthority()));
    }

    private boolean isBankAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(authority -> "ROLE_BANK_ADMIN".equals(authority.getAuthority()));
    }

    private Long requireBankId(Authentication authentication) {
        Long bankId = principal(authentication).bankId();
        if (bankId == null) throw new AccessDeniedException("A bank administrator must be assigned to a bank");
        return bankId;
    }

    private UserPrincipal principal(Authentication authentication) {
        if (authentication.getPrincipal() instanceof UserPrincipal userPrincipal) return userPrincipal;
        throw new AccessDeniedException("Invalid authenticated principal");
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getBank() == null ? null : user.getBank().getId(), user.getFirstName(),
                user.getLastName(), user.getEmail(), user.getPhone(), user.getRole(), user.getStatus());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
