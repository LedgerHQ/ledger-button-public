import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  BlockchainFamily,
  BlockchainProvider,
} from "./model/BlockchainProvider.js";
import type { Account } from "../account/service/AccountService.js";
import { BlockchainProviderManager } from "./BlockchainProviderManager.js";

const createProvider = (
  family: BlockchainFamily,
): BlockchainProvider & {
  init: ReturnType<typeof vi.fn>;
  setSelectedAccount: ReturnType<typeof vi.fn>;
  setNetwork: ReturnType<typeof vi.fn>;
} => ({
  family,
  init: vi.fn(() => () => undefined),
  setSelectedAccount: vi.fn(),
  setNetwork: vi.fn(),
});

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
});
