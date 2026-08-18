import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainProviderFactoryRegistration } from "@api/blockchain-provider/model/BlockchainProviderFactory";
import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade";
import type { Account } from "@api/model/Account";
import type { BlockchainConfig } from "@api/model/dappConfig/BlockchainConfig";
import type { ContextService } from "@internal/context/ContextService";
import type { DAppConfig } from "@internal/dAppConfig/model/dAppConfigTypes";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock";
import { aCurrencyDescriptor } from "../__mocks__/currencyDescriptorMock";
import { DefaultBlockchainProviderManager } from "./DefaultBlockchainProviderManager";

const evmConfig: BlockchainConfig = {
  blockchain: "ethereum",
  appName: "Ethereum",
  networks: [],
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
  injectWalletProviders: vi.fn(),
  setSelectedAccount: vi.fn(),
  setNetwork: vi.fn(),
  describeCurrency: vi.fn().mockReturnValue(undefined),
  describeNetwork: vi.fn().mockReturnValue(undefined),
});

describe("DefaultBlockchainProviderManager", () => {
  let manager: DefaultBlockchainProviderManager;
  let core: CoreFacade;
  let dappConfig: DAppConfig;
  let evmCreate: ReturnType<typeof vi.fn>;
  let solanaCreate: ReturnType<typeof vi.fn>;
  let factories: BlockchainProviderFactoryRegistration[];
  let evmProvider: ReturnType<typeof createMockProvider>;
  let solanaProvider: ReturnType<typeof createMockProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    const contextService = createMockContextService();

    manager = new DefaultBlockchainProviderManager(
      contextService,
      loggerFactory as never,
    );
    core = createMockCoreFacade();
    dappConfig = createMockDAppConfig();
    evmProvider = createMockProvider("ethereum");
    solanaProvider = createMockProvider("solana");
    evmCreate = vi.fn().mockReturnValue(evmProvider);
    solanaCreate = vi.fn().mockReturnValue(solanaProvider);
    factories = [
      { family: "ethereum", create: evmCreate },
      { family: "solana", create: solanaCreate },
    ];
  });

  describe("init()", () => {
    it("creates providers with core and the per-family config slice", () => {
      manager.init(core, dappConfig, factories);

      expect(evmCreate).toHaveBeenCalledWith(core, evmConfig);
      expect(solanaCreate).toHaveBeenCalledWith(core, solanaConfig);
    });

    it("calls injectWalletProviders on each provider", () => {
      manager.init(core, dappConfig, factories);

      expect(evmProvider.injectWalletProviders).toHaveBeenCalledOnce();
      expect(solanaProvider.injectWalletProviders).toHaveBeenCalledOnce();
    });

    it("skips factories whose family has no dApp config", () => {
      dappConfig = {
        ...createMockDAppConfig(),
        blockchains: [evmConfig],
      } as DAppConfig;

      manager.init(core, dappConfig, factories);

      expect(evmCreate).toHaveBeenCalledOnce();
      expect(solanaCreate).not.toHaveBeenCalled();
    });

    it("pushes initial context to providers after wiring", () => {
      const account = { currencyId: "ethereum" } as Account;
      const contextService = createMockContextService(account, 137);

      manager = new DefaultBlockchainProviderManager(
        contextService,
        loggerFactory as never,
      );

      manager.init(core, dappConfig, factories);

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
  });
});
