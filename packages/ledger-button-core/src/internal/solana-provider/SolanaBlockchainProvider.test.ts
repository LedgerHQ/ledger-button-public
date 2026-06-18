/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LedgerSolanaWallet } from "./ledger-solana-wallet/LedgerSolanaWallet.js";
import type { CoreFacade } from "../blockchain-provider/model/BlockchainProvider.js";
import type { DAppConfigV2 } from "../dAppConfig/v2/model/dAppConfigV2Types.js";
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

const createMockCore = (): CoreFacade => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSign: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

const createMockDAppConfig = (): DAppConfigV2 =>
  ({
    name: "test",
    liveAppId: "test",
    domainUrl: "test",
    referralUrl: "test",
    blockchains: [],
    featureFlags: {},
  }) as DAppConfigV2;

describe("SolanaBlockchainProvider", () => {
  let provider: SolanaBlockchainProvider;
  let core: CoreFacade;
  let dappConfig: DAppConfigV2;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new SolanaBlockchainProvider();
    core = createMockCore();
    dappConfig = createMockDAppConfig();
  });

  test('family is "solana"', () => {
    expect(provider.family).toBe("solana");
  });

  describe("injectWalletProviders()", () => {
    test("creates LedgerSolanaWallet with core", () => {
      provider.injectWalletProviders(core, dappConfig);

      expect(LedgerSolanaWallet).toHaveBeenCalledWith(core);
    });

    test("creates SolanaWalletProvider with the LedgerSolanaWallet instance", () => {
      provider.injectWalletProviders(core, dappConfig);

      const wallet = vi.mocked(LedgerSolanaWallet).mock.results[0]?.value;
      expect(SolanaWalletProvider).toHaveBeenCalledWith(wallet);
    });

    test("calls init() on SolanaWalletProvider", () => {
      provider.injectWalletProviders(core, dappConfig);

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
      provider.injectWalletProviders(core, dappConfig);
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
      provider.injectWalletProviders(core, dappConfig);
      const wallet = vi.mocked(LedgerSolanaWallet).mock.results[0]?.value;

      provider.setNetwork(101);

      expect(wallet.setNetwork).toHaveBeenCalledWith(101);
    });
  });
});
