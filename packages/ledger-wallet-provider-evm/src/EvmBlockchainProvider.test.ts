import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createMockCoreFacade } from "./__mocks__/coreFacadeMock";
import { EvmBlockchainProvider } from "./EvmBlockchainProvider";
import { EvmWalletProvider } from "./EvmWalletProvider";
import { EvmWalletProviderInjector } from "./EvmWalletProviderInjector";

vi.mock("./EvmWalletProvider", () => ({
  EvmWalletProvider: vi.fn().mockImplementation(function () {
    return {
      setSelectedAccount: vi.fn(),
      setNetwork: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

vi.mock("./EvmWalletProviderInjector", () => ({
  EvmWalletProviderInjector: vi.fn().mockImplementation(function () {
    return {
      family: "ethereum",
      inject: vi.fn(() => vi.fn()),
    };
  }),
}));

// Bind stub sign use-cases so the local container resolves without needing the
// real injectable graph (and decorator metadata) at test time.
vi.mock("./di/evmProviderModule", async () => {
  const { ContainerModule } = await import("inversify");
  const { evmProviderModuleTypes } =
    await import("./di/evmProviderModuleTypes");
  return {
    evmProviderModule: () =>
      new ContainerModule(({ bind }) => {
        bind(evmProviderModuleTypes.SignTransactionUseCase).toConstantValue({
          execute: () => undefined,
        });
        bind(evmProviderModuleTypes.SignRawTransactionUseCase).toConstantValue({
          execute: () => undefined,
        });
        bind(evmProviderModuleTypes.SignTypedDataUseCase).toConstantValue({
          execute: () => undefined,
        });
        bind(evmProviderModuleTypes.SignPersonalMessageUseCase).toConstantValue(
          {
            execute: () => undefined,
          },
        );
      }),
  };
});

const createMockBlockchainConfig = (
  rpcMethods: BlockchainConfig["rpcMethods"] = { local: [], broadcasted: [] },
): BlockchainConfig => ({
  blockchain: "ethereum",
  appName: "Ethereum",
  networks: [],
  rpcMethods,
  appDependencies: { appName: "Ethereum", dependencies: [] },
});

describe("EvmBlockchainProvider", () => {
  let provider: EvmBlockchainProvider;
  let core: CoreFacade;
  let dappConfig: BlockchainConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    core = createMockCoreFacade();
    dappConfig = createMockBlockchainConfig();
    provider = new EvmBlockchainProvider(core, dappConfig);
  });

  test('family is "ethereum"', () => {
    expect(provider.family).toBe("ethereum");
  });

  describe("injectWalletProvider()", () => {
    test("creates EvmWalletProvider with core, sign deps and a rpcMethods loader", () => {
      provider.injectWalletProvider();

      expect(EvmWalletProvider).toHaveBeenCalledWith(
        core,
        expect.objectContaining({
          signTransaction: expect.anything(),
          signRawTransaction: expect.anything(),
          signTypedData: expect.anything(),
          signPersonalMessage: expect.anything(),
        }),
        expect.any(Function),
      );
    });

    test("rpcMethods loader resolves to the config rpcMethods", async () => {
      const rpcMethods = {
        local: ["eth_sign"],
        broadcasted: ["eth_sendRawTransaction"],
      };
      provider = new EvmBlockchainProvider(
        core,
        createMockBlockchainConfig(rpcMethods),
      );
      provider.injectWalletProvider();

      const loader = vi.mocked(EvmWalletProvider).mock.calls[0]?.[2];
      await expect(loader?.()).resolves.toEqual(rpcMethods);
    });

    test("constructs EvmWalletProviderInjector with the EvmWalletProvider instance", () => {
      provider.injectWalletProvider();

      const inner = vi.mocked(EvmWalletProvider).mock.results[0]?.value;
      expect(EvmWalletProviderInjector).toHaveBeenCalledWith(inner);
    });

    test("calls inject() on EvmWalletProviderInjector", () => {
      provider.injectWalletProvider();

      const walletProvider = vi.mocked(EvmWalletProviderInjector).mock
        .results[0]?.value;
      expect(walletProvider.inject).toHaveBeenCalledOnce();
    });
  });

  describe("setSelectedAccount()", () => {
    test("is a no-op before injectWalletProvider", () => {
      expect(() => provider.setSelectedAccount(undefined)).not.toThrow();
    });

    test("delegates to EvmWalletProvider after injection", () => {
      provider.injectWalletProvider();
      const inner = vi.mocked(EvmWalletProvider).mock.results[0]?.value;

      provider.setSelectedAccount(undefined);

      expect(inner.setSelectedAccount).toHaveBeenCalledWith(undefined);
    });
  });

  describe("setNetwork()", () => {
    test("is a no-op before injectWalletProvider", () => {
      expect(() => provider.setNetwork(137)).not.toThrow();
    });

    test("delegates to EvmWalletProvider after injection", () => {
      provider.injectWalletProvider();
      const inner = vi.mocked(EvmWalletProvider).mock.results[0]?.value;

      provider.setNetwork(137);

      expect(inner.setNetwork).toHaveBeenCalledWith(137);
    });
  });

  describe("currency capability", () => {
    test("describeCurrency describes an owned currency", () => {
      expect(provider.describeCurrency("ethereum")).toEqual({
        currencyId: "ethereum",
        family: "ethereum",
        networkId: "1",
        nativeDecimals: 18,
      });
    });

    test("describeCurrency returns undefined for another family", () => {
      expect(provider.describeCurrency("solana")).toBeUndefined();
    });

    test("describeNetwork maps 137 to polygon", () => {
      expect(provider.describeNetwork("137")?.currencyId).toBe("polygon");
    });
  });

  describe("disconnect()", () => {
    test("is a no-op before injectWalletProvider", async () => {
      await expect(provider.disconnect()).resolves.toBeUndefined();
    });

    test("delegates to EvmWalletProvider after injection", async () => {
      provider.injectWalletProvider();
      const inner = vi.mocked(EvmWalletProvider).mock.results[0]?.value;

      await provider.disconnect();

      expect(inner.disconnect).toHaveBeenCalledOnce();
    });
  });
});
