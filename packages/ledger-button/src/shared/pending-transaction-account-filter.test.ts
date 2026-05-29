import type { PendingTransaction } from "@ledgerhq/ledger-wallet-provider-core";
import { describe, expect, it } from "vitest";

import {
  type AccountIdentity,
  belongsToAccount,
} from "./pending-transaction-account-filter.js";

function createPendingTx(
  overrides: Partial<PendingTransaction> = {},
): PendingTransaction {
  return {
    hash: "0xpending",
    chainId: 1,
    address: "0xabc123",
    timestamp: "2026-04-08T10:00:00.000Z",
    type: "sent",
    value: "1000000000000000000",
    formattedValue: "1 ETH",
    ticker: "ETH",
    currencyName: "Ethereum",
    ledgerId: "ethereum",
    ...overrides,
  };
}

const ethereumAccount: AccountIdentity = {
  freshAddress: "0xabc123",
  currencyId: "ethereum",
};

describe("belongsToAccount", () => {
  it("returns true when both freshAddress and currencyId match", () => {
    expect(belongsToAccount(createPendingTx(), ethereumAccount)).toBe(true);
  });

  it("returns false when the address differs", () => {
    expect(
      belongsToAccount(
        createPendingTx({ address: "0xdifferent" }),
        ethereumAccount,
      ),
    ).toBe(false);
  });

  it("returns false when the currency differs (same address, other chain)", () => {
    expect(
      belongsToAccount(
        createPendingTx({ ledgerId: "polygon" }),
        ethereumAccount,
      ),
    ).toBe(false);
  });

  it("returns false when the account is undefined", () => {
    expect(belongsToAccount(createPendingTx(), undefined)).toBe(false);
  });
});
