import axios, { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, apiErrorMessage, assertResourceId, normalizeApiError } from "./api";
import { makeSession } from "../test/authFixtures";

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe("API authentication interceptor", () => {
  it("refreshes an expired access token and retries the request", async () => {
    const session = makeSession();
    session.expiresAt = Date.now() - 1;
    localStorage.setItem("flowline.auth.session", JSON.stringify(session));

    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      if (adapter.mock.calls.length === 1) {
        const response = { status: 401, statusText: "Unauthorized", data: {}, headers: {}, config } as AxiosResponse;
        throw new AxiosError("Expired access token", AxiosError.ERR_BAD_REQUEST, config, undefined, response);
      }
      return { status: 200, statusText: "OK", data: { accepted: true }, headers: {}, config };
    });
    api.defaults.adapter = adapter;
    vi.spyOn(axios, "post").mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as never,
      data: { data: { accessToken: "fresh-access", refreshToken: "fresh-refresh", expiresInSeconds: 300 } },
    });

    const response = await api.get("/private");

    expect(response.data).toEqual({ accepted: true });
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(adapter.mock.calls[1]?.[0].headers.Authorization).toBe("Bearer fresh-access");
    expect(JSON.parse(localStorage.getItem("flowline.auth.session") ?? "{}").tokens.accessToken).toBe("fresh-access");
  });

  it("clears the session when an expired token cannot be refreshed", async () => {
    localStorage.setItem("flowline.auth.session", JSON.stringify(makeSession()));
    api.defaults.adapter = vi.fn<AxiosAdapter>(async (config) => {
      const response = { status: 401, statusText: "Unauthorized", data: {}, headers: {}, config } as AxiosResponse;
      throw new AxiosError("Unauthorized", AxiosError.ERR_BAD_REQUEST, config, undefined, response);
    });
    vi.spyOn(axios, "post").mockRejectedValue(new Error("Refresh token rejected"));
    const expired = vi.fn();
    window.addEventListener("auth:session-expired", expired);

    try {
      await expect(api.get("/private")).rejects.toThrow("Refresh token rejected");
      expect(localStorage.getItem("flowline.auth.session")).toBeNull();
      expect(expired).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener("auth:session-expired", expired);
    }
  });

  it("emits a forbidden event for server-side role denials", async () => {
    api.defaults.adapter = vi.fn<AxiosAdapter>(async (config) => {
      const response = { status: 403, statusText: "Forbidden", data: {}, headers: {}, config } as AxiosResponse;
      throw new AxiosError("Forbidden", AxiosError.ERR_BAD_REQUEST, config, undefined, response);
    });
    const forbidden = vi.fn();
    window.addEventListener("auth:forbidden", forbidden);

    try {
      await expect(api.get("/private")).rejects.toThrow("Forbidden");
      expect(forbidden).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener("auth:forbidden", forbidden);
    }
  });
});

describe("API error and resource ID normalization", () => {
  it("rejects missing, empty, nonnumeric, and nonpositive resource IDs", () => {
    for (const id of [undefined, null, "", "abc", "0", -1, Number.NaN]) {
      expect(() => assertResourceId(id, "ATM")).toThrow("ATM ID must be a positive integer.");
    }
    expect(assertResourceId("42", "ATM")).toBe("42");
  });

  it("normalizes backend conflict details without losing the error code", () => {
    const error = new AxiosError("Conflict", AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
      status: 409,
      statusText: "Conflict",
      data: { message: "Only pending recommendations can be changed", errorCode: "INVALID_RECOMMENDATION_STATUS" },
      headers: {},
      config: {} as never,
    } as AxiosResponse);

    expect(normalizeApiError(error)).toMatchObject({
      status: 409,
      message: "Only pending recommendations can be changed",
      code: "INVALID_RECOMMENDATION_STATUS",
    });
    expect(apiErrorMessage(error)).toContain("[INVALID_RECOMMENDATION_STATUS]");
  });
});
