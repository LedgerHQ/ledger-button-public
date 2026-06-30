/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LedgerSolanaWallet } from "./ledger-solana-wallet/LedgerSolanaWallet.js";
import type { CoreFacade } from "../../api/blockchain-provider/model/CoreFacade.js";
import type { BlockchainConfig } from "../../api/model/dappConfig/BlockchainConfig.js";
import { createMockCoreFacade } from "../../internal/blockchain-provider/__mocks__/coreFacadeMock.js";
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
    wallet: {},
    init: vi.fn(),
  })),
}));

const createMockBlockchainConfig = (): BlockchainConfig => ({
  blockchain: "solana",
  appName: "Solana",
  networks: [],
  appDependencies: { appName: "Solana", dependencies: [] },
});

describe("SolanaBlockchainProvider", () => {
  let provider: SolanaBlockchainProvider;
  let core: CoreFacade;
  let dappConfig: BlockchainConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    core = createMockCoreFacade();
    dappConfig = createMockBlockchainConfig();
    provider = new SolanaBlockchainProvider(core, dappConfig);
  });

  test('family is "solana"', () => {
    expect(provider.family).toBe("solana");
  });

  describe("injectWalletProviders()", () => {
    test("creates LedgerSolanaWallet with core", () => {
      provider.injectWalletProviders();

      expect(LedgerSolanaWallet).toHaveBeenCalledWith(core);
    });

    test("creates SolanaWalletProvider with the LedgerSolanaWallet instance", () => {
      provider.injectWalletProviders();

      const wallet = vi.mocked(LedgerSolanaWallet).mock.results[0]?.value;
      expect(SolanaWalletProvider).toHaveBeenCalledWith(wallet);
    });

    test("calls init() on SolanaWalletProvider", () => {
      provider.injectWalletProviders();

      const walletProvider =
        vi.mocked(SolanaWalletProvider).mock.results[0]?.value;
      expect(walletProvider.init).toHaveBeenCalledOnce();
    });
  });

  describe("setSelectedAccount()", () => {
    test("is a no-op before injectWalletProviders", () => {
      expect(() => provider.setSelectedAccount(undefined)).not.toThrow();
    });

    test("delegates to LedgerSolanaWallet after injection", () => {
      provider.injectWalletProviders();
      const wallet = vi.mocked(LedgerSolanaWallet).mock.results[0]?.value;

      provider.setSelectedAccount(undefined);

      expect(wallet.setSelectedAccount).toHaveBeenCalledWith(undefined);
    });
  });

  describe("setNetwork()", () => {
    test("is a no-op before injectWalletProviders", () => {
      expect(() => provider.setNetwork(101)).not.toThrow();
    });

    test("delegates to LedgerSolanaWallet after injection", () => {
      provider.injectWalletProviders();
      const wallet = vi.mocked(LedgerSolanaWallet).mock.results[0]?.value;

      provider.setNetwork(101);

      expect(wallet.setNetwork).toHaveBeenCalledWith(101);
    });
  });
});
