import type { BroadcastResponse } from "@ledgerhq/ledger-wallet-provider-core";
import { describe, expect, it } from "vitest";

import { XrpApiError } from "../model/XrpApiError";
import { assertSubmitAccepted } from "./xrpSubmitResult";

function submitResponse(result: string | object): BroadcastResponse {
  return { jsonrpc: "2.0", id: 1, result };
}

function rejection(response: BroadcastResponse): XrpApiError {
  try {
    assertSubmitAccepted(response);
  } catch (error) {
    return error as XrpApiError;
  }
  throw new Error("Expected assertSubmitAccepted to throw");
}

describe("assertSubmitAccepted", () => {
  it.each(["tesSUCCESS", "terQUEUED"])(
    "accepts the preliminary result %s",
    (engine_result) => {
      expect(() =>
        assertSubmitAccepted(
          submitResponse({ status: "success", engine_result }),
        ),
      ).not.toThrow();
    },
  );

  it("accepts a coin-service broadcast response", () => {
    expect(() =>
      assertSubmitAccepted({ transactionIdentifier: "ABC123" }),
    ).not.toThrow();
  });

  it.each([
    ["temMALFORMED", "Malformed transaction."],
    ["tefPAST_SEQ", "This sequence number has already passed."],
    ["telINSUF_FEE_P", "Fee insufficient."],
    ["terPRE_SEQ", "Missing/inapplicable prior transaction."],
    ["tecUNFUNDED_PAYMENT", "Insufficient XRP balance to send."],
  ])("rejects %s and keeps the engine result", (engine_result, message) => {
    const error = rejection(
      submitResponse({
        status: "success",
        engine_result,
        engine_result_message: message,
      }),
    );

    expect(error).toBeInstanceOf(XrpApiError);
    expect(error.code).toBe("SUBMIT_FAILED");
    expect(error.engineResult).toBe(engine_result);
    expect(error.message).toContain(engine_result);
    expect(error.message).toContain(message);
  });

  it("rejects a JSON-RPC error response", () => {
    const error = rejection({
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32600, message: "Invalid Request" },
    });

    expect(error.code).toBe("SUBMIT_FAILED");
    expect(error.message).toContain("Invalid Request");
    expect(error.engineResult).toBeUndefined();
  });

  it("rejects a rippled error result", () => {
    const error = rejection(
      submitResponse({
        status: "error",
        error: "invalidParams",
        error_message: "Missing field 'tx_blob'.",
      }),
    );

    expect(error.message).toContain("Missing field 'tx_blob'.");
  });

  it.each([
    ["a result without engine_result", submitResponse({ status: "success" })],
    ["a string result", submitResponse("ok")],
    [
      "a null result",
      { jsonrpc: "2.0", id: 1, result: null } as unknown as BroadcastResponse,
    ],
  ])("rejects %s instead of reporting success", (_name, response) => {
    expect(rejection(response).code).toBe("SUBMIT_FAILED");
  });
});
