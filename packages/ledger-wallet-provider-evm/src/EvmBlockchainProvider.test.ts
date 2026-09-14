import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createMockCoreFacade } from "./__mocks__/coreFacadeMock";
import { EvmBlockchainProvider } from "./EvmBlockchainProvider";
import { EvmWalletProvider } from "./EvmWalletProvider";
import { LedgerEIP1193Provider } from "./LedgerEIP1193Provider";

vi.mock("./LedgerEIP1193Provider", () => ({
  LedgerEIP1193Provider: vi.fn().mockImplementation(function () {
    return {
      setSelectedAccount: vi.fn(),
      setNetwork: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

vi.mock("./EvmWalletProvider", () => ({
  EvmWalletProvider: vi.fn().mockImplementation(function () {
    return {
      family: "ethereum",
      init: vi.fn(() => vi.fn()),
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

const MOCK_NETWORKS: BlockchainConfig["networks"] = [
  {
    id: "1",
    currencyId: "ethereum",
    currencyName: "Ethereum",
    currencyTicker: "ETH",
  },
  {
    id: "137",
    currencyId: "polygon",
    currencyName: "Polygon",
    currencyTicker: "POL",
  },
];

const createMockBlockchainConfig = (
  rpcMethods: BlockchainConfig["rpcMethods"] = { local: [], broadcasted: [] },
  networks: BlockchainConfig["networks"] = MOCK_NETWORKS,
): BlockchainConfig => ({
  blockchain: "ethereum",
  appName: "Ethereum",
  networks,
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

  describe("injectWalletProviders()", () => {
    test("creates LedgerEIP1193Provider with core, sign deps and a rpcMethods loader", () => {
      provider.injectWalletProviders();

      expect(LedgerEIP1193Provider).toHaveBeenCalledWith(
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
      provider.injectWalletProviders();

      const loader = vi.mocked(LedgerEIP1193Provider).mock.calls[0]?.[2];
      await expect(loader?.()).resolves.toEqual(rpcMethods);
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

  describe("currency capability", () => {
    test("describeCurrency describes a network present in the dApp config", () => {
      expect(provider.describeCurrency("ethereum")).toEqual({
        currencyId: "ethereum",
        family: "ethereum",
        networkId: "1",
        nativeDecimals: 18,
      });
    });

    test("describeCurrency returns undefined for a currency not in the dApp config", () => {
      expect(provider.describeCurrency("solana")).toBeUndefined();
    });

    test("describeCurrency returns undefined for an EVM currency not in the dApp config", () => {
      expect(provider.describeCurrency("arbitrum")).toBeUndefined();
    });

    test("describeNetwork maps chain 137 to polygon when in the dApp config", () => {
      expect(provider.describeNetwork("137")?.currencyId).toBe("polygon");
    });

    test("describeNetwork returns undefined for a chain not in the dApp config", () => {
      expect(provider.describeNetwork("42161")).toBeUndefined();
    });

    test("describeCurrency resolves a custom network added via dApp config override", () => {
      const providerWithBlast = new EvmBlockchainProvider(core, {
        ...dappConfig,
        networks: [
          ...MOCK_NETWORKS,
          {
            id: "81457",
            currencyId: "blast",
            currencyName: "Blast",
            currencyTicker: "ETH",
          },
        ],
      });
      expect(providerWithBlast.describeCurrency("blast")).toEqual({
        currencyId: "blast",
        family: "ethereum",
        networkId: "81457",
        nativeDecimals: 18,
      });
    });
  });

  describe("disconnect()", () => {
    test("is a no-op before injectWalletProviders", async () => {
      await expect(provider.disconnect()).resolves.toBeUndefined();
    });

    test("delegates to LedgerEIP1193Provider after injection", async () => {
      provider.injectWalletProviders();
      const inner = vi.mocked(LedgerEIP1193Provider).mock.results[0]?.value;

      await provider.disconnect();

      expect(inner.disconnect).toHaveBeenCalledOnce();
    });
  });
});
