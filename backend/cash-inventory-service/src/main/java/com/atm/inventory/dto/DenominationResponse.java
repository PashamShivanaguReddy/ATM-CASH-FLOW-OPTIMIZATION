package com.atm.inventory.dto;

import java.math.BigDecimal;

public record DenominationResponse(Integer denomination, Integer noteCount, BigDecimal totalAmount) { }
