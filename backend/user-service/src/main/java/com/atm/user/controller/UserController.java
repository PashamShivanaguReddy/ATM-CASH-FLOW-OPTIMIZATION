package com.atm.user.controller;

import com.atm.common.api.ApiResponse;
import com.atm.domain.dto.UserDto;
import com.atm.domain.entity.UserRole;
import com.atm.domain.entity.UserStatus;
import com.atm.user.dto.UserCreateRequest;
import com.atm.user.dto.UserUpdateRequest;
import com.atm.user.service.UserManagementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/users")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BANK_ADMIN')")
public class UserController {
    private final UserManagementService service;

    public UserController(UserManagementService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<Page<UserDto>> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) Long bankId,
            Authentication authentication) {
        return ApiResponse.success("Users retrieved", service.list(page, pageSize, search, role, status, bankId, authentication), "/api/users");
    }

    @GetMapping("/{id}")
    public ApiResponse<UserDto> get(@PathVariable long id, Authentication authentication) {
        return ApiResponse.success("User retrieved", service.get(id, authentication), "/api/users/" + id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserDto> create(@Valid @RequestBody UserCreateRequest request, Authentication authentication) {
        return ApiResponse.success("User created", service.create(request, authentication), "/api/users");
    }

    @PutMapping("/{id}")
    public ApiResponse<UserDto> update(@PathVariable long id, @Valid @RequestBody UserUpdateRequest request, Authentication authentication) {
        return ApiResponse.success("User updated", service.update(id, request, authentication), "/api/users/" + id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id, Authentication authentication) {
        service.delete(id, authentication);
    }
}
