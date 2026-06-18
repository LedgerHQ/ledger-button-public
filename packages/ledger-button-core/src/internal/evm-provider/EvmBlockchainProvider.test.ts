import { beforeEach, describe, expect, test, vi } from "vitest";

import type {
  ProviderDAppConfig,
  ProviderDAppConfigFactory,
  WalletProviderCore,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { EvmBlockchainProvider } from "./EvmBlockchainProvider.js";
import { EvmWalletProvider } from "./EvmWalletProvider.js";
import { LedgerEIP1193Provider } from "./LedgerEIP1193Provider.js";

vi.mock("./LedgerEIP1193Provider.js", () => ({
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

const createMockHost = (): WalletProviderCore => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSign: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

describe("EvmBlockchainProvider", () => {
  let host: WalletProviderCore;

  beforeEach(() => {
    vi.clearAllMocks();
    host = createMockHost();
  });

  test('family is "evm"', () => {
    expect(new EvmBlockchainProvider(host).family).toBe("evm");
  });

  describe("constructor", () => {
    test("passes host as first arg to LedgerEIP1193Provider", () => {
      new EvmBlockchainProvider(host);

      expect(LedgerEIP1193Provider).toHaveBeenCalledWith(
        host,
        expect.any(Function),
      );
    });

    test("loadRpcMethods loader resolves rpcMethods from configFactory", async () => {
      const rpcMethods: ProviderDAppConfig["rpcMethods"] = {
        local: ["eth_call"],
        broadcasted: ["eth_sendRawTransaction"],
      };
      const configFactory: ProviderDAppConfigFactory = vi
        .fn()
        .mockResolvedValue({ rpcMethods } as ProviderDAppConfig);

      new EvmBlockchainProvider(host, configFactory);

      const loadRpcMethods = vi.mocked(LedgerEIP1193Provider).mock
        .calls[0]?.[1];
      await expect(loadRpcMethods?.()).resolves.toEqual(rpcMethods);
    });

    test("loadRpcMethods loader resolves to undefined when no configFactory provided", async () => {
      new EvmBlockchainProvider(host);

      const loadRpcMethods = vi.mocked(LedgerEIP1193Provider).mock
        .calls[0]?.[1];
      await expect(loadRpcMethods?.()).resolves.toBeUndefined();
    });

    test("constructs EvmWalletProvider with the LedgerEIP1193Provider instance", () => {
      new EvmBlockchainProvider(host);

      const innerProvider = vi.mocked(LedgerEIP1193Provider).mock.results[0]
        ?.value;
      expect(EvmWalletProvider).toHaveBeenCalledWith(innerProvider);
    });
  });

  describe("getWalletProvider()", () => {
    test("returns the EvmWalletProvider instance", () => {
      const evmProvider = new EvmBlockchainProvider(host);
      const walletProvider =
        vi.mocked(EvmWalletProvider).mock.results[0]?.value;

      expect(evmProvider.getWalletProvider()).toBe(walletProvider);
    });
  });

  describe("setSelectedAccount()", () => {
    test("delegates to the inner LedgerEIP1193Provider", () => {
      const evmProvider = new EvmBlockchainProvider(host);
      const inner = vi.mocked(LedgerEIP1193Provider).mock.results[0]?.value;

      evmProvider.setSelectedAccount(undefined);

      expect(inner.setSelectedAccount).toHaveBeenCalledWith(undefined);
    });
  });

  describe("setNetwork()", () => {
    test("delegates to the inner LedgerEIP1193Provider", () => {
      const evmProvider = new EvmBlockchainProvider(host);
      const inner = vi.mocked(LedgerEIP1193Provider).mock.results[0]?.value;

      evmProvider.setNetwork(137);

      expect(inner.setNetwork).toHaveBeenCalledWith(137);
    });
  });
});
