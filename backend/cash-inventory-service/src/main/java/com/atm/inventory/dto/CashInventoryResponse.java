package com.atm.inventory.dto;

import java.math.BigDecimal;
import java.util.List;

public record CashInventoryResponse(Long atmId, List<DenominationResponse> denominations, BigDecimal totalCash) { }
