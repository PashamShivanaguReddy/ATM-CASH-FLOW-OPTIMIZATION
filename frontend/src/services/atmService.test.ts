import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { createAtm, getAtm, updateAtm } from "./atmService";
import type { AtmInput, AtmRecord } from "../types/atm";

afterEach(() => vi.restoreAllMocks());

const atm: AtmRecord = {
  id: 12,
  atmCode: "ATM-12",
  bankId: 3,
  location: "Main Street",
  city: "Pune",
  state: "Maharashtra",
  latitude: 18.52,
  longitude: 73.85,
  atmType: "STANDARD",
  status: "ACTIVE",
  cashCapacity: 100000,
  minimumCashThreshold: 10000,
  maximumCashThreshold: 90000,
  currentCash: 25000,
  lastRefillAt: null,
  createdAt: "2026-10-02T08:00:00Z",
  updatedAt: "2026-10-02T08:00:00Z",
};

const input: AtmInput = {
  atmCode: atm.atmCode,
  bankId: atm.bankId,
  location: atm.location,
  city: atm.city,
  state: atm.state,
  latitude: atm.latitude,
  longitude: atm.longitude,
  atmType: atm.atmType,
  status: atm.status,
  cashCapacity: atm.cashCapacity,
  minimumCashThreshold: atm.minimumCashThreshold,
  maximumCashThreshold: atm.maximumCashThreshold,
  currentCash: atm.currentCash,
};

describe("ATM write response normalization", () => {
  it("returns the raw ATM DTO from create", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({ data: atm } as never);

    await expect(createAtm(input)).resolves.toEqual(atm);
  });

  it("returns the raw ATM DTO from update", async () => {
    vi.spyOn(api, "put").mockResolvedValueOnce({ data: atm } as never);

    await expect(updateAtm(atm.id, input)).resolves.toEqual(atm);
  });

  it("rejects malformed route IDs before making a request", async () => {
    const get = vi.spyOn(api, "get");

    await expect(getAtm("undefined")).rejects.toThrow("ATM ID must be a positive integer.");
    expect(get).not.toHaveBeenCalled();
  });
});