/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

import type { ProviderRegistrationContext } from "../provider-registration/ChainProviderRegistration.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";
import { registerWalletStandard } from "./registerWalletStandard.js";
import { solanaProviderRegistration } from "./solanaProviderRegistration.js";

const disconnect = vi.fn().mockResolvedValue(undefined);
const unregisterWallet = vi.fn();

vi.mock("./LedgerSolanaWallet.js", () => ({
  LedgerSolanaWallet: vi.fn().mockImplementation(() => ({
    features: { "standard:disconnect": { disconnect } },
  })),
}));

vi.mock("./registerWalletStandard.js", () => ({
  registerWalletStandard: vi.fn(() => unregisterWallet),
}));

const context = {
  core: {} as ProviderRegistrationContext["core"],
  app: {} as ProviderRegistrationContext["app"],
};

describe("solanaProviderRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("registers a Wallet Standard wallet built from core + app", () => {
    solanaProviderRegistration.register(context);

    expect(LedgerSolanaWallet).toHaveBeenCalledWith(context.core, context.app);
    expect(registerWalletStandard).toHaveBeenCalledTimes(1);
  });

  test("unregister disconnects the wallet and tears the registration down", () => {
    const unregister = solanaProviderRegistration.register(context);

    unregister();

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(unregisterWallet).toHaveBeenCalledTimes(1);
  });
});
