import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  BlockchainFamily,
  BlockchainProvider,
  BlockchainProviderFactory,
  ProviderDAppConfigFactory,
  WalletProvider,
  WalletProviderCore,
} from "./model/BlockchainProvider.js";
import type { Account } from "../account/service/AccountService.js";
import { BlockchainProviderManager } from "./BlockchainProviderManager.js";

const createWalletProvider = (): WalletProvider & {
  init: ReturnType<typeof vi.fn>;
} => ({
  family: "evm",
  init: vi.fn(() => vi.fn()),
});

const createProvider = (
  family: BlockchainFamily,
  walletProvider?: WalletProvider,
): BlockchainProvider => {
  const wp = walletProvider ?? createWalletProvider();
  return {
    family,
    getWalletProvider: vi.fn(() => wp),
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  };
};

const loggerFactory = () =>
  ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

describe("BlockchainProviderManager", () => {
  let manager: BlockchainProviderManager;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    manager = new BlockchainProviderManager(loggerFactory as any);
  });

  it("registers and retrieves a provider by family", () => {
    const evm = createProvider("evm");
    manager.registerProvider(evm);

    expect(manager.getProvider("evm").extract()).toBe(evm);
    expect(manager.getProvider("solana").isNothing()).toBe(true);
  });

  it("resolves a provider for a known currency", () => {
    const evm = createProvider("evm");
    manager.registerProvider(evm);

    expect(manager.getProviderForCurrency("ethereum").extract()).toBe(evm);
  });

  it("returns Nothing for an unknown currency", () => {
    expect(manager.getProviderForCurrency("dogecoin").isNothing()).toBe(true);
  });

  it("returns all registered providers", () => {
    const evm = createProvider("evm");
    const solana = createProvider("solana");
    manager.registerProvider(evm);
    manager.registerProvider(solana);

    expect(manager.getProviders()).toEqual([evm, solana]);
  });

  it("fans out the selected account to every provider", () => {
    const evm = createProvider("evm");
    const solana = createProvider("solana");
    manager.registerProvider(evm);
    manager.registerProvider(solana);

    const account = { currencyId: "ethereum" } as Account;
    manager.setSelectedAccount(account);

    expect(evm.setSelectedAccount).toHaveBeenCalledWith(account);
    expect(solana.setSelectedAccount).toHaveBeenCalledWith(account);
  });

  it("fans out the network to every provider", () => {
    const evm = createProvider("evm");
    manager.registerProvider(evm);

    manager.setNetwork(137);

    expect(evm.setNetwork).toHaveBeenCalledWith(137);
  });

  describe("addBlockchainProvider", () => {
    const createMockHost = (): WalletProviderCore => ({
      broadcastRPC: vi.fn(),
      requestAccount: vi.fn(),
      requestSign: vi.fn(),
      requestSwitchChain: vi.fn(),
      disconnect: vi.fn(),
    });

    const createMockConfigFactory = (): ProviderDAppConfigFactory =>
      vi.fn().mockResolvedValue(undefined);

    it("calls the factory with host and config", () => {
      const host = createMockHost();
      const config = createMockConfigFactory();
      const provider = createProvider("evm");
      const factory: BlockchainProviderFactory = vi.fn(() => provider);

      manager.addBlockchainProvider(factory, config, host);

      expect(factory).toHaveBeenCalledWith(host, config);
    });

    it("calls init() on the WalletProvider returned by getWalletProvider()", () => {
      const walletProvider = createWalletProvider();
      const provider = createProvider("evm", walletProvider);
      const factory: BlockchainProviderFactory = vi.fn(() => provider);

      manager.addBlockchainProvider(
        factory,
        createMockConfigFactory(),
        createMockHost(),
      );

      expect(walletProvider.init).toHaveBeenCalledOnce();
    });

    it("registers the provider so it can be retrieved by family", () => {
      const provider = createProvider("evm");
      const factory: BlockchainProviderFactory = vi.fn(() => provider);

      manager.addBlockchainProvider(
        factory,
        createMockConfigFactory(),
        createMockHost(),
      );

      expect(manager.getProvider("evm").extract()).toBe(provider);
    });

    it("returns the teardown from init()", () => {
      const teardown = vi.fn();
      const walletProvider = createWalletProvider();
      walletProvider.init.mockReturnValue(teardown);
      const provider = createProvider("evm", walletProvider);

      const result = manager.addBlockchainProvider(
        vi.fn(() => provider),
        createMockConfigFactory(),
        createMockHost(),
      );

      expect(result).toBe(teardown);
    });
  });
});
