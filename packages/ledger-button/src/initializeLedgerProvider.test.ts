import { NoBlockchainProviderError } from "@ledgerhq/ledger-wallet-provider-core";
import { describe, expect, it, vi } from "vitest";

vi.mock("./components/index", () => ({}));
vi.mock("./ledger-button-app", () => ({
  LedgerButtonApp: class LedgerButtonApp {},
}));

import { initializeLedgerProvider } from "./index";

describe("initializeLedgerProvider", () => {
  it("throws before mounting when no blockchain factory is passed", () => {
    const target = {} as HTMLElement;

    expect(() =>
      initializeLedgerProvider({
        apiKey: "key",
        dAppIdentifier: "dapp",
        blockchainProviderFactories: [],
        target,
      }),
    ).toThrow(NoBlockchainProviderError);
  });

  it("throws before mounting when blockchainProviderFactories is omitted", () => {
    const target = {} as HTMLElement;

    expect(() =>
      initializeLedgerProvider({
        apiKey: "key",
        dAppIdentifier: "dapp",
        target,
      }),
    ).toThrow(NoBlockchainProviderError);
  });
});
