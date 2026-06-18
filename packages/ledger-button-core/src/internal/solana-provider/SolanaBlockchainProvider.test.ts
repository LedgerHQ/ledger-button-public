/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { WalletProviderCore } from "../blockchain-provider/model/BlockchainProvider.js";
import { LedgerSolanaWallet } from "./ledger-solana-wallet/LedgerSolanaWallet.js";
import { SolanaBlockchainProvider } from "./SolanaBlockchainProvider.js";
import { SolanaWalletProvider } from "./SolanaWalletProvider.js";

vi.mock("./ledger-solana-wallet/LedgerSolanaWallet.js", () => ({
  LedgerSolanaWallet: vi.fn().mockImplementation(() => ({
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  })),
}));

vi.mock("./SolanaWalletProvider.js", () => ({
  SolanaWalletProvider: vi.fn().mockImplementation(() => ({
    family: "solana",
    init: vi.fn().mockReturnValue(vi.fn()),
  })),
}));

const createMockHost = (): WalletProviderCore => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSign: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

describe("SolanaBlockchainProvider", () => {
  let host: WalletProviderCore;

  beforeEach(() => {
    vi.clearAllMocks();
    host = createMockHost();
  });

  test('family is "solana"', () => {
    expect(new SolanaBlockchainProvider(host).family).toBe("solana");
  });

  describe("constructor", () => {
    test("creates LedgerSolanaWallet with host", () => {
      new SolanaBlockchainProvider(host);

      expect(LedgerSolanaWallet).toHaveBeenCalledWith(host);
    });

    test("creates SolanaWalletProvider with the LedgerSolanaWallet instance", () => {
      new SolanaBlockchainProvider(host);

      const wallet = vi.mocked(LedgerSolanaWallet).mock.results[0]?.value;
      expect(SolanaWalletProvider).toHaveBeenCalledWith(wallet);
    });
  });

  describe("getWalletProvider()", () => {
    test("returns the SolanaWalletProvider instance", () => {
      const provider = new SolanaBlockchainProvider(host);
      const walletProvider =
        vi.mocked(SolanaWalletProvider).mock.results[0]?.value;

      expect(provider.getWalletProvider()).toBe(walletProvider);
    });
  });

  describe("setSelectedAccount()", () => {
    test("delegates to LedgerSolanaWallet", () => {
      const provider = new SolanaBlockchainProvider(host);
      const wallet = vi.mocked(LedgerSolanaWallet).mock.results[0]?.value;

      provider.setSelectedAccount(undefined);

      expect(wallet.setSelectedAccount).toHaveBeenCalledWith(undefined);
    });
  });

  describe("setNetwork()", () => {
    test("delegates to LedgerSolanaWallet", () => {
      const provider = new SolanaBlockchainProvider(host);
      const wallet = vi.mocked(LedgerSolanaWallet).mock.results[0]?.value;

      provider.setNetwork(101);

      expect(wallet.setNetwork).toHaveBeenCalledWith(101);
    });
  });
});
