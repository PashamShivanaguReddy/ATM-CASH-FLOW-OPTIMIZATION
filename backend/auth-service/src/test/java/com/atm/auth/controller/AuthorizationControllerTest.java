package com.atm.auth.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import static org.junit.jupiter.api.Assertions.*;

class AuthorizationControllerTest {
    @Test void administrationEndpointRequiresAdminRole() throws NoSuchMethodException {
        var method = AuthorizationController.class.getMethod("administrationCheck");
        assertEquals("hasAnyRole('SUPER_ADMIN', 'BANK_ADMIN')", method.getAnnotation(PreAuthorize.class).value());
    }
}
