import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  LedgerEIP1193Provider,
  type LedgerEIP1193ProviderDeps,
} from "./ledger-eip1193/LedgerEIP1193Provider.js";
import type { CoreFacade } from "../blockchain-provider/model/BlockchainProvider.js";
import type { DAppConfigV2 } from "../dAppConfig/v2/model/dAppConfigV2Types.js";
import {
  EvmBlockchainProvider,
  type EvmBlockchainProviderDeps,
} from "./EvmBlockchainProvider.js";
import { EvmWalletProvider } from "./EvmWalletProvider.js";

vi.mock("./ledger-eip1193/LedgerEIP1193Provider.js", () => ({
  LedgerEIP1193Provider: vi.fn().mockImplementation(() => ({
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  })),
}));

vi.mock("./EvmWalletProvider.js", () => ({
  EvmWalletProvider: vi.fn().mockImplementation(() => ({
    family: "evm",
    init: vi.fn(() => vi.fn()),
  })),
}));

const createMockCore = (): CoreFacade => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

const createMockDeps = (): EvmBlockchainProviderDeps =>
  ({
    navigationIntentService: { emit: vi.fn(), observe: vi.fn() },
    signTransaction: { execute: vi.fn() },
    signRawTransaction: { execute: vi.fn() },
    signTypedData: { execute: vi.fn() },
    signPersonalMessage: { execute: vi.fn() },
    trackBroadcastedTransaction: { execute: vi.fn() },
  }) as unknown as LedgerEIP1193ProviderDeps;

const createMockDAppConfig = (): DAppConfigV2 =>
  ({
    name: "test",
    liveAppId: "test",
    domainUrl: "test",
    referralUrl: "test",
    blockchains: [],
    featureFlags: {},
  }) as DAppConfigV2;

describe("EvmBlockchainProvider", () => {
  let provider: EvmBlockchainProvider;
  let core: CoreFacade;
  let dappConfig: DAppConfigV2;
  let deps: EvmBlockchainProviderDeps;

  beforeEach(() => {
    vi.clearAllMocks();
    core = createMockCore();
    dappConfig = createMockDAppConfig();
    deps = createMockDeps();
    provider = new EvmBlockchainProvider(core, dappConfig, deps);
  });

  test('family is "evm"', () => {
    expect(provider.family).toBe("evm");
  });

  describe("injectWalletProviders()", () => {
    test("creates LedgerEIP1193Provider with core, deps and a rpcMethods loader", () => {
      provider.injectWalletProviders();

      expect(LedgerEIP1193Provider).toHaveBeenCalledWith(
        core,
        deps,
        expect.any(Function),
      );
    });

    test("rpcMethods loader resolves to undefined when no matching blockchain in config", async () => {
      provider.injectWalletProviders();

      const loader = vi.mocked(LedgerEIP1193Provider).mock.calls[0]?.[2];
      await expect(loader?.()).resolves.toBeUndefined();
    });

    test("constructs EvmWalletProvider with the LedgerEIP1193Provider instance", () => {
      provider.injectWalletProviders();

      const inner = vi.mocked(LedgerEIP1193Provider).mock.results[0]?.value;
      expect(EvmWalletProvider).toHaveBeenCalledWith(inner);
    });

    test("calls init() on EvmWalletProvider", () => {
      provider.injectWalletProviders();

      const walletProvider =
        vi.mocked(EvmWalletProvider).mock.results[0]?.value;
      expect(walletProvider.init).toHaveBeenCalledOnce();
    });
  });

  describe("setSelectedAccount()", () => {
    test("is a no-op before injectWalletProviders", () => {
      expect(() => provider.setSelectedAccount(undefined)).not.toThrow();
    });

    test("delegates to LedgerEIP1193Provider after injection", () => {
      provider.injectWalletProviders();
      const inner = vi.mocked(LedgerEIP1193Provider).mock.results[0]?.value;

      provider.setSelectedAccount(undefined);

      expect(inner.setSelectedAccount).toHaveBeenCalledWith(undefined);
    });
  });

  describe("setNetwork()", () => {
    test("is a no-op before injectWalletProviders", () => {
      expect(() => provider.setNetwork(137)).not.toThrow();
    });

    test("delegates to LedgerEIP1193Provider after injection", () => {
      provider.injectWalletProviders();
      const inner = vi.mocked(LedgerEIP1193Provider).mock.results[0]?.value;

      provider.setNetwork(137);

      expect(inner.setNetwork).toHaveBeenCalledWith(137);
    });
  });
});
