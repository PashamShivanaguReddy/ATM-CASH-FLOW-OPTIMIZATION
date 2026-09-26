package com.atm.transaction.controller;

import com.atm.domain.entity.TransactionType;
import com.atm.transaction.dto.TransactionCreateRequest;
import com.atm.transaction.dto.TransactionCreateResult;
import com.atm.transaction.dto.TransactionResponse;
import com.atm.transaction.service.TransactionService;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransactionControllerApiTest {
    @Mock TransactionService service;
    TransactionController controller;
    MockMvc mvc;
    Instant timestamp = Instant.parse("2026-01-01T10:00:00Z");

    @BeforeEach
    void setUp() { controller = new TransactionController(service); mvc = MockMvcBuilders.standaloneSetup(controller).setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver()).setMessageConverters(new MappingJackson2HttpMessageConverter()).build(); }

    @Test
    void createsTransactionWithCreatedStatus() throws Exception {
        var response = new TransactionResponse(20L, "tx-1", 10L, TransactionType.WITHDRAWAL, BigDecimal.TEN, timestamp, true, "VISA", null);
        when(service.create(any(TransactionCreateRequest.class), isNull(), anyString())).thenReturn(new TransactionCreateResult(response, true));

        mvc.perform(post("/api/transactions").contentType("application/json").content("""
                {"transactionId":"tx-1","atmId":10,"transactionType":"WITHDRAWAL","amount":10,"timestamp":"2026-01-01T10:00:00Z","success":true,"cardType":"VISA"}
                """))
                .andExpect(status().isCreated());
    }

    @Test
    void forwardsDateFilteringAndPagination() throws Exception {
        when(service.search(isNull(), eq(timestamp), eq(timestamp.plusSeconds(3600)), eq(TransactionType.WITHDRAWAL), eq(true), any(), isNull()))
                .thenReturn(new PageImpl<>(List.of()));

        Page<?> result = controller.dateRange(timestamp, timestamp.plusSeconds(3600), TransactionType.WITHDRAWAL, true, PageRequest.of(0, 20), null);
        assert result.isEmpty();

        verify(service).search(isNull(), eq(timestamp), eq(timestamp.plusSeconds(3600)), eq(TransactionType.WITHDRAWAL), eq(true), any(), isNull());
    }
}