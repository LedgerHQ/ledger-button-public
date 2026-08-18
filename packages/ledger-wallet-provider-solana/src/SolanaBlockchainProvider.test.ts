/**
 * @vitest-environment jsdom
 */
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createMockCoreFacade } from "./__mocks__/coreFacadeMock";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet";
import { SolanaBlockchainProvider } from "./SolanaBlockchainProvider";
import { SolanaWalletProvider } from "./SolanaWalletProvider";

vi.mock("./LedgerSolanaWallet", () => ({
  LedgerSolanaWallet: vi.fn().mockImplementation(() => ({
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  })),
}));

vi.mock("./SolanaWalletProvider", () => ({
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
  rpcMethods: { local: [], broadcasted: [] },
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
    test("creates LedgerSolanaWallet with core and the sign use-cases", () => {
      provider.injectWalletProviders();

      expect(LedgerSolanaWallet).toHaveBeenCalledWith(
        core,
        expect.objectContaining({
          signSolanaMessage: expect.any(Object),
          signSolanaTransaction: expect.any(Object),
        }),
      );
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

  describe("currency capability", () => {
    test("describeCurrency describes an owned currency", () => {
      expect(provider.describeCurrency("solana")).toEqual({
        currencyId: "solana",
        family: "solana",
        networkId: "mainnet",
        nativeDecimals: 9,
      });
    });

    test("describeCurrency returns undefined for another family", () => {
      expect(provider.describeCurrency("ethereum")).toBeUndefined();
    });

    test("describeNetwork maps mainnet to solana", () => {
      expect(provider.describeNetwork("mainnet")?.currencyId).toBe("solana");
    });
  });
});
