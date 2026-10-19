/**
 * @vitest-environment jsdom
 */
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createMockCoreFacade } from "./__mocks__/coreFacadeMock";
import { SolanaBlockchainProvider } from "./SolanaBlockchainProvider";
import { SolanaWalletProvider } from "./SolanaWalletProvider";
import { SolanaWalletProviderInjector } from "./SolanaWalletProviderInjector";

vi.mock("./SolanaWalletProvider", () => ({
  SolanaWalletProvider: vi.fn().mockImplementation(function () {
    return {
      setSelectedAccount: vi.fn(),
      setNetwork: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

vi.mock("./SolanaWalletProviderInjector", () => ({
  SolanaWalletProviderInjector: vi.fn().mockImplementation(function () {
    return {
      family: "solana",
      wallet: {},
      inject: vi.fn(),
    };
  }),
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

  describe("injectWalletProvider()", () => {
    test("creates SolanaWalletProvider with core and the sign use-cases", () => {
      provider.injectWalletProvider();

      expect(SolanaWalletProvider).toHaveBeenCalledWith(
        core,
        expect.objectContaining({
          signSolanaMessage: expect.any(Object),
          signSolanaTransaction: expect.any(Object),
        }),
      );
    });

    test("creates SolanaWalletProviderInjector with the SolanaWalletProvider instance", () => {
      provider.injectWalletProvider();

      const wallet = vi.mocked(SolanaWalletProvider).mock.results[0]?.value;
      expect(SolanaWalletProviderInjector).toHaveBeenCalledWith(wallet);
    });

    test("calls inject() on SolanaWalletProviderInjector", () => {
      provider.injectWalletProvider();

      const walletProvider = vi.mocked(SolanaWalletProviderInjector).mock
        .results[0]?.value;
      expect(walletProvider.inject).toHaveBeenCalledOnce();
    });
  });

  describe("setSelectedAccount()", () => {
    test("is a no-op before injectWalletProvider", () => {
      expect(() => provider.setSelectedAccount(undefined)).not.toThrow();
    });

    test("delegates to SolanaWalletProvider after injection", () => {
      provider.injectWalletProvider();
      const wallet = vi.mocked(SolanaWalletProvider).mock.results[0]?.value;

      provider.setSelectedAccount(undefined);

      expect(wallet.setSelectedAccount).toHaveBeenCalledWith(undefined);
    });
  });

  describe("setNetwork()", () => {
    test("is a no-op before injectWalletProvider", () => {
      expect(() => provider.setNetwork(101)).not.toThrow();
    });

    test("delegates to SolanaWalletProvider after injection", () => {
      provider.injectWalletProvider();
      const wallet = vi.mocked(SolanaWalletProvider).mock.results[0]?.value;

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

  describe("disconnect()", () => {
    test("is a no-op before injectWalletProvider", async () => {
      await expect(provider.disconnect()).resolves.toBeUndefined();
    });

    test("delegates to SolanaWalletProvider after injection", async () => {
      provider.injectWalletProvider();
      const wallet = vi.mocked(SolanaWalletProvider).mock.results[0]?.value;

      await provider.disconnect();

      expect(wallet.disconnect).toHaveBeenCalledOnce();
    });
  });
});
