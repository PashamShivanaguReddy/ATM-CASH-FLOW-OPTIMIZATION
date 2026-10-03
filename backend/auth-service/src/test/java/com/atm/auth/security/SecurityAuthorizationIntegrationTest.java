package com.atm.auth.security;

import com.atm.auth.AuthServiceApplication;
import com.atm.domain.entity.User;
import com.atm.domain.entity.UserRole;
import com.atm.domain.entity.UserStatus;
import com.atm.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest(classes = AuthServiceApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "jwt.secret=a-strong-test-secret-with-at-least-32-chars",
        "spring.datasource.url=jdbc:h2:mem:security-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class SecurityAuthorizationIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwordEncoder;
    @Test @WithMockUser(roles = "BANK_ADMIN") void bankAdminCanAccessAdministrationEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/authorization/administration-check")).andExpect(status().isOk());
    }
    @Test @WithMockUser(roles = "BANK_MANAGER") void managerCannotAccessAdministrationEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/authorization/administration-check")).andExpect(status().isForbidden());
    }
    @Test
    void activeUserCanLoginAndReceiveTokens() throws Exception {
        User user = new User();
        user.setFirstName("Login");
        user.setLastName("Test");
        user.setEmail("login-test@example.com");
        user.setPasswordHash(passwordEncoder.encode("correct-password"));
        user.setRole(UserRole.ATM_OPERATOR);
        user.setStatus(UserStatus.ACTIVE);
        users.saveAndFlush(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"login-test@example.com","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("ATM_OPERATOR"));
    }
    @Test
    void invalidCredentialsReturnUnauthorizedErrorResponse() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("""
                        {"email":"missing@example.com","password":"wrong-password"}
                        """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }
    @Test
    void emptyLoginBodyStillReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }
}
