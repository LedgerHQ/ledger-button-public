import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainProviderFactory } from "@api/blockchain-provider/model/BlockchainProviderFactory";
import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade";
import type { Account } from "@api/model/Account";
import type {
  BlockchainConfig,
  BlockchainNetwork,
} from "@api/model/dappConfig/BlockchainConfig";
import type { ContextService } from "@internal/context/ContextService";
import type { DAppConfig } from "@internal/dAppConfig/model/dAppConfigTypes";
import type { StorageService } from "@internal/storage/StorageService";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock";
import { aCurrencyDescriptor } from "../__mocks__/currencyDescriptorMock";
import { DefaultBlockchainProviderManager } from "./DefaultBlockchainProviderManager";

const ethMainnet: BlockchainNetwork = {
  id: "1",
  currencyId: "ethereum",
  currencyName: "Ethereum",
  currencyTicker: "ETH",
};

const customNetwork: BlockchainNetwork = {
  id: "31337",
  currencyId: "anvil",
  currencyName: "Anvil",
  currencyTicker: "ETH",
};

const evmConfig: BlockchainConfig = {
  blockchain: "ethereum",
  appName: "Ethereum",
  networks: [ethMainnet],
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: { appName: "Ethereum", dependencies: [] },
};

const solanaConfig: BlockchainConfig = {
  blockchain: "solana",
  appName: "Solana",
  networks: [],
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: { appName: "Solana", dependencies: [] },
};

const evmDescriptor = aCurrencyDescriptor();
const solanaDescriptor = aCurrencyDescriptor({
  currencyId: "solana",
  family: "solana",
  networkId: "mainnet",
  nativeDecimals: 9,
});

const loggerFactory = () =>
  ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const createMockDAppConfig = (): DAppConfig =>
  ({
    name: "test",
    liveAppId: "test",
    domainUrl: "test",
    referralUrl: "test",
    blockchains: [evmConfig, solanaConfig],
    featureFlags: {},
  }) as DAppConfig;

const createMockContextService = (
  account?: Account,
  chainId = 1,
): ContextService => {
  const selectedAccounts = new Map<string, Account>();
  if (account) {
    selectedAccounts.set("ethereum", account);
  }
  return {
    getContext: vi.fn().mockReturnValue({ selectedAccounts, chainId }),
    observeContext: vi.fn().mockReturnValue({
      subscribe: vi.fn(
        (
          cb: (ctx: {
            selectedAccounts: Map<string, Account>;
            chainId: number;
          }) => void,
        ) => {
          cb({ selectedAccounts, chainId });
        },
      ),
    }),
    onEvent: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
};

const createMockProvider = (family: "ethereum" | "solana") => ({
  family,
  dappConfig: family === "ethereum" ? evmConfig : solanaConfig,
  injectWalletProviders: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
  setSelectedAccount: vi.fn(),
  setNetwork: vi.fn(),
  describeCurrency: vi.fn().mockReturnValue(undefined),
  describeNetwork: vi.fn().mockReturnValue(undefined),
});

const createMockStorageService = (
  networkOverrides: BlockchainNetwork[] = [],
) =>
  ({
    getConfigOverrides: vi.fn().mockReturnValue(networkOverrides),
  }) as unknown as StorageService;

describe("DefaultBlockchainProviderManager", () => {
  let manager: DefaultBlockchainProviderManager;
  let core: CoreFacade;
  let dappConfig: DAppConfig;
  let evmCreate: BlockchainProviderFactory;
  let solanaCreate: BlockchainProviderFactory;
  let factories: BlockchainProviderFactory[];
  let evmProvider: ReturnType<typeof createMockProvider>;
  let solanaProvider: ReturnType<typeof createMockProvider>;

  beforeEach(() => {
    vi.clearAllMocks();

    manager = new DefaultBlockchainProviderManager(
      createMockContextService() as never,
      loggerFactory as never,
      createMockStorageService(),
    );
    core = createMockCoreFacade();
    dappConfig = createMockDAppConfig();
    evmProvider = createMockProvider("ethereum");
    solanaProvider = createMockProvider("solana");
    evmCreate = vi
      .fn()
      .mockReturnValue(Right(evmProvider)) as BlockchainProviderFactory;
    solanaCreate = vi
      .fn()
      .mockReturnValue(Right(solanaProvider)) as BlockchainProviderFactory;
    factories = [evmCreate, solanaCreate];
  });

  describe("init()", () => {
    it("calls each factory with core and the full blockchain configs array", () => {
      manager.init(core, dappConfig, factories);

      const expectedBlockchains: BlockchainConfig[] = [evmConfig, solanaConfig];
      expect(evmCreate).toHaveBeenCalledWith(core, expectedBlockchains);
      expect(solanaCreate).toHaveBeenCalledWith(core, expectedBlockchains);
    });

    it("calls injectWalletProviders on each registered provider", () => {
      manager.init(core, dappConfig, factories);

      expect(evmProvider.injectWalletProviders).toHaveBeenCalledOnce();
      expect(solanaProvider.injectWalletProviders).toHaveBeenCalledOnce();
    });

    it("skips factories that return Left", () => {
      solanaCreate = vi.fn().mockReturnValue(Left("solana"));
      factories = [evmCreate, solanaCreate];

      manager.init(core, dappConfig, factories);

      expect(evmProvider.injectWalletProviders).toHaveBeenCalledOnce();
      expect(solanaProvider.injectWalletProviders).not.toHaveBeenCalled();
    });

    it("pushes initial context to providers after wiring", () => {
      const account = { currencyId: "ethereum" } as Account;
      const managerWithContext = new DefaultBlockchainProviderManager(
        createMockContextService(account, 137) as never,
        loggerFactory as never,
        createMockStorageService(),
      );

      managerWithContext.init(core, dappConfig, factories);

      expect(evmProvider.setSelectedAccount).toHaveBeenCalledWith(account);
      expect(evmProvider.setNetwork).toHaveBeenCalledWith(137);
    });
  });

  describe("setSelectedAccounts()", () => {
    it("fans out the per-family account to each provider", () => {
      manager.init(core, dappConfig, factories);

      const evmAccount = { currencyId: "ethereum" } as Account;
      const solanaAccount = { currencyId: "solana" } as Account;
      manager.setSelectedAccounts(
        new Map([
          ["ethereum", evmAccount],
          ["solana", solanaAccount],
        ]),
      );

      expect(evmProvider.setSelectedAccount).toHaveBeenCalledWith(evmAccount);
      expect(solanaProvider.setSelectedAccount).toHaveBeenCalledWith(
        solanaAccount,
      );
    });
  });

  describe("setNetwork()", () => {
    it("fans out to every provider", () => {
      manager.init(core, dappConfig, factories);

      manager.setNetwork(137);

      expect(evmProvider.setNetwork).toHaveBeenCalledWith(137);
    });
  });

  const managerWithOverrides = (networkOverrides: BlockchainNetwork[]) => {
    const scoped = new DefaultBlockchainProviderManager(
      createMockContextService() as never,
      loggerFactory as never,
      createMockStorageService(networkOverrides),
    );
    scoped.init(core, dappConfig, factories);
    return scoped;
  };

  describe("getNetworks()", () => {
    it("returns the configured networks when no override is stored", () => {
      manager.init(core, dappConfig, factories);

      expect(manager.getNetworks("ethereum")).toEqual([ethMainnet]);
    });

    it("appends stored overrides to the configured networks", () => {
      const scoped = managerWithOverrides([customNetwork]);

      expect(scoped.getNetworks("ethereum")).toEqual([
        ethMainnet,
        customNetwork,
      ]);
    });

    it("does not duplicate an override that matches a configured network", () => {
      const scoped = managerWithOverrides([ethMainnet]);

      expect(scoped.getNetworks("ethereum")).toEqual([ethMainnet]);
    });

    it("drops overrides from the list once storage is cleared", () => {
      const storage = createMockStorageService([customNetwork]);
      const scoped = new DefaultBlockchainProviderManager(
        createMockContextService() as never,
        loggerFactory as never,
        storage,
      );
      scoped.init(core, dappConfig, factories);

      vi.mocked(storage.getConfigOverrides).mockReturnValue([]);

      expect(scoped.getNetworks("ethereum")).toEqual([ethMainnet]);
    });

    it("does not apply EVM overrides to another family", () => {
      const scoped = managerWithOverrides([customNetwork]);

      expect(scoped.getNetworks("solana")).toEqual([]);
    });

    it("returns empty when no provider is registered for the family", () => {
      manager.init(core, dappConfig, factories);

      expect(manager.getNetworks("bitcoin" as never)).toEqual([]);
    });
  });

  describe("getAllNetworks()", () => {
    it("returns networks from all registered providers", () => {
      manager.init(core, dappConfig, factories);

      expect(manager.getAllNetworks()).toEqual([ethMainnet]);
    });

    it("includes EVM overrides in the result", () => {
      const scoped = managerWithOverrides([customNetwork]);

      expect(scoped.getAllNetworks()).toEqual([ethMainnet, customNetwork]);
    });
  });

  describe("describeCurrency()", () => {
    it("returns the descriptor of the provider that claims the currency", () => {
      manager.init(core, dappConfig, factories);
      solanaProvider.describeCurrency.mockReturnValue(solanaDescriptor);

      expect(manager.describeCurrency("solana").extract()).toEqual(
        solanaDescriptor,
      );
    });

    it("stops at the first provider that answers", () => {
      manager.init(core, dappConfig, factories);
      evmProvider.describeCurrency.mockReturnValue(evmDescriptor);
      solanaProvider.describeCurrency.mockReturnValue(solanaDescriptor);

      expect(manager.describeCurrency("ethereum").extract()).toEqual(
        evmDescriptor,
      );
      expect(solanaProvider.describeCurrency).not.toHaveBeenCalled();
    });

    it("returns empty when no provider claims the currency", () => {
      manager.init(core, dappConfig, factories);

      expect(manager.describeCurrency("bitcoin").isNothing()).toBe(true);
    });

    it("describes a currency only known through a stored override", () => {
      const scoped = managerWithOverrides([customNetwork]);

      expect(scoped.describeCurrency("anvil").extract()).toEqual({
        currencyId: "anvil",
        family: "ethereum",
        networkId: "31337",
        nativeDecimals: 18,
      });
    });
  });

  describe("describeNetwork()", () => {
    it("returns the descriptor of the provider that owns the network", () => {
      manager.init(core, dappConfig, factories);
      evmProvider.describeNetwork.mockReturnValue(evmDescriptor);

      expect(manager.describeNetwork("1").extract()).toEqual(evmDescriptor);
    });

    it("returns empty when unknown", () => {
      manager.init(core, dappConfig, factories);

      expect(manager.describeNetwork("999").isNothing()).toBe(true);
    });

    it("describes a network only known through a stored override", () => {
      const scoped = managerWithOverrides([customNetwork]);

      expect(scoped.describeNetwork("31337").extract()).toEqual({
        currencyId: "anvil",
        family: "ethereum",
        networkId: "31337",
        nativeDecimals: 18,
      });
    });
  });

  describe("firstProviderAnswer (via describeCurrency / describeNetwork)", () => {
    it("short-circuits: stops as soon as a provider answers", () => {
      manager.init(core, dappConfig, factories);
      evmProvider.describeCurrency.mockReturnValue(evmDescriptor);

      manager.describeCurrency("ethereum");

      // solana provider should never be queried once EVM answered
      expect(solanaProvider.describeCurrency).not.toHaveBeenCalled();
    });

    it("exhausts all providers before returning Nothing", () => {
      manager.init(core, dappConfig, factories);

      manager.describeCurrency("bitcoin");

      expect(evmProvider.describeCurrency).toHaveBeenCalledWith("bitcoin");
      expect(solanaProvider.describeCurrency).toHaveBeenCalledWith("bitcoin");
    });
  });
});
