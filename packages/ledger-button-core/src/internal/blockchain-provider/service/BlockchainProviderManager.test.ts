import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade.js";
import type { Account } from "@api/model/Account.js";
import type { BlockchainConfig } from "@api/model/dappConfig/BlockchainConfig.js";
import type { ContextService } from "@internal/context/ContextService.js";
import type { DAppConfig } from "@internal/dAppConfig/model/dAppConfigTypes.js";
import { EvmBlockchainProvider } from "@internal/evm-provider/EvmBlockchainProvider.js";
import { SolanaBlockchainProvider } from "@internal/solana-provider/SolanaBlockchainProvider.js";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock.js";
import { aCurrencyDescriptor } from "../__mocks__/currencyDescriptorMock.js";
import { DefaultBlockchainProviderManager } from "./DefaultBlockchainProviderManager.js";

vi.mock("@internal/evm-provider/EvmBlockchainProvider.js", () => ({
  EvmBlockchainProvider: vi.fn().mockImplementation(() => ({
    family: "ethereum",
    injectWalletProviders: vi.fn(),
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
    describeCurrency: vi.fn().mockReturnValue(undefined),
    describeNetwork: vi.fn().mockReturnValue(undefined),
  })),
}));

vi.mock("@internal/solana-provider/SolanaBlockchainProvider.js", () => ({
  SolanaBlockchainProvider: vi.fn().mockImplementation(() => ({
    family: "solana",
    injectWalletProviders: vi.fn(),
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
    describeCurrency: vi.fn().mockReturnValue(undefined),
    describeNetwork: vi.fn().mockReturnValue(undefined),
  })),
}));

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

type MockedProvider = {
  injectWalletProviders: ReturnType<typeof vi.fn>;
  setSelectedAccount: ReturnType<typeof vi.fn>;
  setNetwork: ReturnType<typeof vi.fn>;
  describeCurrency: ReturnType<typeof vi.fn>;
  describeNetwork: ReturnType<typeof vi.fn>;
};

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

describe("DefaultBlockchainProviderManager", () => {
  let manager: DefaultBlockchainProviderManager;
  let core: CoreFacade;
  let dappConfig: DAppConfig;

  const evmInstance = () =>
    vi.mocked(EvmBlockchainProvider).mock.results[0]?.value as MockedProvider;
  const solanaInstance = () =>
    vi.mocked(SolanaBlockchainProvider).mock.results[0]
      ?.value as MockedProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    const contextService = createMockContextService();

    manager = new DefaultBlockchainProviderManager(
      contextService,
      loggerFactory as never,
    );
    core = createMockCoreFacade();
    dappConfig = createMockDAppConfig();
  });

  describe("init()", () => {
    it("creates providers with core and the per-family config slice", () => {
      manager.init(core, dappConfig);

      expect(EvmBlockchainProvider).toHaveBeenCalledWith(core, evmConfig);
      expect(SolanaBlockchainProvider).toHaveBeenCalledWith(core, solanaConfig);
    });

    it("calls injectWalletProviders on each provider", () => {
      manager.init(core, dappConfig);

      expect(evmInstance().injectWalletProviders).toHaveBeenCalledOnce();
      expect(solanaInstance().injectWalletProviders).toHaveBeenCalledOnce();
    });

    it("pushes initial context to providers after wiring", () => {
      const account = { currencyId: "ethereum" } as Account;
      const contextService = createMockContextService(account, 137);

      manager = new DefaultBlockchainProviderManager(
        contextService,
        loggerFactory as never,
      );

      manager.init(core, dappConfig);

      expect(evmInstance().setSelectedAccount).toHaveBeenCalledWith(account);
      expect(evmInstance().setNetwork).toHaveBeenCalledWith(137);
    });
  });

  describe("setSelectedAccounts()", () => {
    it("fans out the per-family account to each provider", () => {
      manager.init(core, dappConfig);

      const evmAccount = { currencyId: "ethereum" } as Account;
      const solanaAccount = { currencyId: "solana" } as Account;
      manager.setSelectedAccounts(
        new Map([
          ["ethereum", evmAccount],
          ["solana", solanaAccount],
        ]),
      );

      expect(evmInstance().setSelectedAccount).toHaveBeenCalledWith(evmAccount);
      expect(solanaInstance().setSelectedAccount).toHaveBeenCalledWith(
        solanaAccount,
      );
    });
  });

  describe("setNetwork()", () => {
    it("fans out to every provider", () => {
      manager.init(core, dappConfig);

      manager.setNetwork(137);

      expect(evmInstance().setNetwork).toHaveBeenCalledWith(137);
    });
  });

  describe("describeCurrency()", () => {
    it("returns the descriptor of the provider that claims the currency", () => {
      manager.init(core, dappConfig);
      solanaInstance().describeCurrency.mockReturnValue(solanaDescriptor);

      expect(manager.describeCurrency("solana").extract()).toEqual(
        solanaDescriptor,
      );
    });

    it("stops at the first provider that answers", () => {
      manager.init(core, dappConfig);
      evmInstance().describeCurrency.mockReturnValue(evmDescriptor);
      solanaInstance().describeCurrency.mockReturnValue(solanaDescriptor);

      expect(manager.describeCurrency("ethereum").extract()).toEqual(
        evmDescriptor,
      );
      expect(solanaInstance().describeCurrency).not.toHaveBeenCalled();
    });

    it("returns empty when no provider claims the currency", () => {
      manager.init(core, dappConfig);

      expect(manager.describeCurrency("bitcoin").isNothing()).toBe(true);
    });
  });

  describe("describeNetwork()", () => {
    it("returns the descriptor of the provider that owns the network", () => {
      manager.init(core, dappConfig);
      evmInstance().describeNetwork.mockReturnValue(evmDescriptor);

      expect(manager.describeNetwork("1").extract()).toEqual(evmDescriptor);
    });

    it("returns empty when unknown", () => {
      manager.init(core, dappConfig);

      expect(manager.describeNetwork("999").isNothing()).toBe(true);
    });
  });
});
