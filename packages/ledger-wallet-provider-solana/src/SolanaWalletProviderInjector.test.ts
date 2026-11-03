/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

import { registerWalletStandard } from "./utils/registerWalletStandard";
import type { SolanaWalletProvider } from "./SolanaWalletProvider";
import { SolanaWalletProviderInjector } from "./SolanaWalletProviderInjector";

vi.mock("./utils/registerWalletStandard", () => ({
  registerWalletStandard: vi.fn().mockReturnValue(vi.fn()),
}));

const createMockWallet = (): SolanaWalletProvider =>
  ({
    features: {
      "standard:disconnect": {
        disconnect: vi.fn().mockResolvedValue(undefined),
      },
    },
  }) as unknown as SolanaWalletProvider;

describe("SolanaWalletProviderInjector", () => {
  let wallet: SolanaWalletProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    wallet = createMockWallet();
  });

  test('family is "solana"', () => {
    expect(new SolanaWalletProviderInjector(wallet).family).toBe("solana");
  });

  describe("inject()", () => {
    test("registers the wallet via registerWalletStandard", () => {
      const provider = new SolanaWalletProviderInjector(wallet);
      const teardown = provider.inject();

      expect(registerWalletStandard).toHaveBeenCalledWith(wallet);

      teardown();
    });

    test("teardown calls disconnect and unregisters the wallet", () => {
      const unregister = vi.fn();
      vi.mocked(registerWalletStandard).mockReturnValue(unregister);

      const provider = new SolanaWalletProviderInjector(wallet);
      const teardown = provider.inject();

      teardown();

      expect(
        wallet.features["standard:disconnect"].disconnect,
      ).toHaveBeenCalled();
      expect(unregister).toHaveBeenCalled();
    });
  });
});
