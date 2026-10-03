import { describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { findTransaction } from "./transactionService";
import type { TransactionRecord } from "../types/transaction";

describe("findTransaction", () => {
	it("returns a transaction when the backend responds with a raw record", async () => {
		const transaction: TransactionRecord = {
			id: 1,
			transactionId: "TXN-123",
			atmId: 7,
			transactionType: "WITHDRAWAL",
			amount: 500,
			timestamp: "2026-10-02T10:00:00Z",
			success: true,
			cardType: "VISA",
			createdAt: "2026-10-02T10:00:01Z",
		};
		vi.spyOn(api, "get").mockResolvedValue({ data: transaction } as never);

		await expect(findTransaction("TXN-123")).resolves.toEqual(transaction);
		expect(api.get).toHaveBeenCalledWith("/transactions/transaction/TXN-123");
	});
});