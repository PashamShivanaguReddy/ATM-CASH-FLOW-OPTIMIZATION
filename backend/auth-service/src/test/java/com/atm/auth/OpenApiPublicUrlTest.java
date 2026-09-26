package com.atm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import io.swagger.v3.oas.models.OpenAPI;

@SpringBootTest
@TestPropertySource(properties = {
        "app.public-base-url=http://localhost:8080",
        "jwt.secret=a-strong-test-secret-with-at-least-32-chars"
})
class OpenApiPublicUrlTest {

    @Autowired
    private OpenAPI openApi;

    @Test
    void openApiUsesGatewayBaseUrlForBrowserRequests() {
        assertNotNull(openApi);
        assertNotNull(openApi.getServers());
        assertFalse(openApi.getServers().isEmpty());
        assertEquals("http://localhost:8080", openApi.getServers().get(0).getUrl());
    }
}
