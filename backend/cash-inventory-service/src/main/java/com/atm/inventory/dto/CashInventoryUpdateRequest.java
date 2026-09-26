package com.atm.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CashInventoryUpdateRequest(@NotEmpty List<@Valid DenominationRequest> denominations) { }
