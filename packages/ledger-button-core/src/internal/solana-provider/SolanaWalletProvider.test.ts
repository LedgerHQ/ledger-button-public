/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { LedgerSolanaWallet } from "./ledger-solana-wallet/LedgerSolanaWallet.js";
import { registerWalletStandard } from "./utils/registerWalletStandard.js";
import { SolanaWalletProvider } from "./SolanaWalletProvider.js";

vi.mock("./utils/registerWalletStandard.js", () => ({
  registerWalletStandard: vi.fn().mockReturnValue(vi.fn()),
}));

const createMockWallet = (): LedgerSolanaWallet =>
  ({
    features: {
      "standard:disconnect": {
        disconnect: vi.fn().mockResolvedValue(undefined),
      },
    },
  }) as unknown as LedgerSolanaWallet;

describe("SolanaWalletProvider", () => {
  let wallet: LedgerSolanaWallet;

  beforeEach(() => {
    vi.clearAllMocks();
    wallet = createMockWallet();
  });

  test('family is "solana"', () => {
    expect(new SolanaWalletProvider(wallet).family).toBe("solana");
  });

  describe("init()", () => {
    test("registers the wallet via registerWalletStandard", () => {
      const provider = new SolanaWalletProvider(wallet);
      const teardown = provider.init();

      expect(registerWalletStandard).toHaveBeenCalledWith(wallet);

      teardown();
    });

    test("teardown calls disconnect and unregisters the wallet", () => {
      const unregister = vi.fn();
      vi.mocked(registerWalletStandard).mockReturnValue(unregister);

      const provider = new SolanaWalletProvider(wallet);
      const teardown = provider.init();

      teardown();

      expect(
        wallet.features["standard:disconnect"].disconnect,
      ).toHaveBeenCalled();
      expect(unregister).toHaveBeenCalled();
    });
  });
});
