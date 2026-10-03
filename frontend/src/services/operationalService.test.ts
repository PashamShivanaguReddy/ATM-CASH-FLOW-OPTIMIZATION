import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { getCashInventory } from "./cashService";
import { getRefills } from "./refillService";
import type { CashInventoryRecord } from "../types/cash";
import type { RefillRecord } from "../types/refill";

afterEach(() => vi.restoreAllMocks());

describe("operational service response normalization", () => {
  it("returns raw cash inventory records", async () => {
    const inventory: CashInventoryRecord = { atmId: 8, denominations: [], totalCash: 22000 };
    vi.spyOn(api, "get").mockResolvedValueOnce({ data: inventory } as never);

    await expect(getCashInventory(8)).resolves.toEqual(inventory);
  });

  it("returns raw refill lists", async () => {
    const refills: RefillRecord[] = [{
      id: 3,
      atmId: 8,
      requestedBy: 7,
      approvedBy: 7,
      refillAmount: 3000,
      refillDate: "2026-10-02T08:00:00Z",
      status: "COMPLETED",
      notes: "Sample refill",
      recommendationId: null,
      createdAt: "2026-10-02T08:00:00Z",
      updatedAt: "2026-10-02T08:00:00Z",
    }];
    vi.spyOn(api, "get").mockResolvedValueOnce({ data: refills } as never);

    await expect(getRefills()).resolves.toEqual(refills);
  });

  it("still unwraps enveloped refill responses", async () => {
    const refills: RefillRecord[] = [];
    vi.spyOn(api, "get").mockResolvedValueOnce({ data: { success: true, data: refills } } as never);

    await expect(getRefills()).resolves.toEqual(refills);
  });
});