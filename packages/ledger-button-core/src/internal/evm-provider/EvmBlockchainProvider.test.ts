import { beforeEach, describe, expect, test, vi } from "vitest";

import { LedgerEIP1193Provider } from "./ledger-eip1193/LedgerEIP1193Provider.js";
import type { BlockchainConfig } from "../../api/model/dappConfig/BlockchainConfig.js";
import { createMockCoreFacade } from "../blockchain-provider/__mocks__/coreFacadeMock.js";
import type { CoreFacade } from "../blockchain-provider/model/BlockchainProvider.js";
import { EvmBlockchainProvider } from "./EvmBlockchainProvider.js";
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

// Bind stub sign use-cases so the local container resolves without needing the
// real injectable graph (and decorator metadata) at test time.
vi.mock("./evmProviderModule.js", async () => {
  const { ContainerModule } = await import("inversify");
  const { evmProviderModuleTypes } = await import(
    "./evmProviderModuleTypes.js"
  );
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
  rpcMethods?: BlockchainConfig["rpcMethods"],
): BlockchainConfig => ({
  blockchain: "evm",
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

  test('family is "evm"', () => {
    expect(provider.family).toBe("evm");
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
});
