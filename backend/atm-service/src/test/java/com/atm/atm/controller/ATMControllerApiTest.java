package com.atm.atm.controller;

import com.atm.atm.service.ATMService;
import com.atm.domain.entity.AtmStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ATMControllerApiTest {
    @Mock ATMService service;
    ATMController controller;
    MockMvc mvc;

    @BeforeEach
    void setUp() { controller = new ATMController(service); mvc = MockMvcBuilders.standaloneSetup(controller).setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver()).setMessageConverters(new MappingJackson2HttpMessageConverter()).build(); }

    @Test
    void listsAtmsWithFilteringAndPagination() throws Exception {
        when(service.list(eq(7L), eq(AtmStatus.LOW_CASH), any(), nullable(org.springframework.security.core.Authentication.class))).thenReturn(new PageImpl<>(List.of()));

        Page<?> result = controller.list(7L, AtmStatus.LOW_CASH, PageRequest.of(1, 5), null);

        assert result.isEmpty();
        verify(service).list(eq(7L), eq(AtmStatus.LOW_CASH), argThat(page -> page.getPageNumber() == 1 && page.getPageSize() == 5), isNull());
    }

    @Test
    void deleteDeactivatesAtmAndReturnsNoContent() throws Exception {
        mvc.perform(delete("/api/atms/10")).andExpect(status().isNoContent());
        verify(service).delete(eq(10L), isNull(), anyString());
    }
}