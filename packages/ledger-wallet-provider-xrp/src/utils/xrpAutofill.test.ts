import type { BroadcastResponse } from "@ledgerhq/ledger-wallet-provider-core";
import { describe, expect, it, vi } from "vitest";

import { autofillTransaction, type XrplRequest } from "./xrpAutofill";

const ACCOUNT = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe";

const PAYMENT = {
  TransactionType: "Payment",
  Destination: "rQruxtzFbPR2JgBp47FEbh4pAyYDStcLJH",
  Amount: "1",
};

function serverInfo(loadFactor: number | undefined): object {
  return {
    status: "success",
    info: {
      load_factor: loadFactor,
      validated_ledger: { base_fee_xrp: 0.00001 },
    },
  };
}

function nodeReplying(results: Record<string, object>): XrplRequest {
  return vi.fn(async (method: string): Promise<BroadcastResponse> => ({
    jsonrpc: "2.0",
    id: 1,
    result: results[method] ?? { status: "error", error: "unexpected" },
  }));
}

const NODE = {
  account_info: { status: "success", account_data: { Sequence: 42 } },
  server_info: serverInfo(1),
  ledger: { status: "success", ledger_index: 500 },
};

describe("autofillTransaction", () => {
  it("fills Sequence, Fee and LastLedgerSequence from the node", async () => {
    const request = nodeReplying(NODE);

    const filled = await autofillTransaction(PAYMENT, ACCOUNT, request);

    expect(filled).toEqual({
      ...PAYMENT,
      Sequence: 42,
      Fee: "10",
      LastLedgerSequence: 520,
    });
    expect(request).toHaveBeenCalledWith("account_info", {
      account: ACCOUNT,
      ledger_index: "current",
    });
    expect(request).toHaveBeenCalledWith("server_info", {});
    expect(request).toHaveBeenCalledWith("ledger", {
      ledger_index: "validated",
    });
  });

  it("keeps the fields the dApp set and asks the node for nothing", async () => {
    const request = nodeReplying(NODE);
    const tx = { ...PAYMENT, Sequence: 1, Fee: "12", LastLedgerSequence: 9 };

    await expect(autofillTransaction(tx, ACCOUNT, request)).resolves.toEqual(
      tx,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it("uses Sequence 0 for a ticketed transaction", async () => {
    const request = nodeReplying(NODE);

    const filled = await autofillTransaction(
      { ...PAYMENT, TicketSequence: 3 },
      ACCOUNT,
      request,
    );

    expect(filled.Sequence).toBe(0);
    expect(request).not.toHaveBeenCalledWith("account_info", expect.anything());
  });

  it.each([
    [undefined, "10"],
    [2.5, "25"],
    [1_000_000, "2000000"],
  ])(
    "scales the base fee by load_factor %s, capped at 2 XRP",
    async (loadFactor, fee) => {
      const request = nodeReplying({
        ...NODE,
        server_info: serverInfo(loadFactor),
      });

      const filled = await autofillTransaction(PAYMENT, ACCOUNT, request);

      expect(filled.Fee).toBe(fee);
    },
  );

  it("rejects with AUTOFILL_FAILED when the account is not funded", async () => {
    const request = nodeReplying({
      ...NODE,
      account_info: {
        status: "error",
        error: "actNotFound",
        error_message: "Account not found.",
      },
    });

    await expect(
      autofillTransaction(PAYMENT, ACCOUNT, request),
    ).rejects.toMatchObject({
      code: "AUTOFILL_FAILED",
      message: "XRPL autofill failed (account_info): Account not found.",
    });
  });

  it("rejects with AUTOFILL_FAILED on a JSON-RPC error response", async () => {
    const request: XrplRequest = vi.fn(async () => ({
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32600, message: "Unsupported RPC method" },
    }));

    await expect(
      autofillTransaction(
        { ...PAYMENT, Sequence: 1, Fee: "10" },
        ACCOUNT,
        request,
      ),
    ).rejects.toMatchObject({
      code: "AUTOFILL_FAILED",
      message: "XRPL autofill failed (ledger): Unsupported RPC method",
    });
  });
});
