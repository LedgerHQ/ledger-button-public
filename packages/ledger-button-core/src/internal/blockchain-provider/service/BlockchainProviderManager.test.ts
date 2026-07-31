import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";
import type { BlockchainConfig } from "../../../api/model/dappConfig/BlockchainConfig.js";
import type { Account } from "../../../internal/account/service/AccountService.js";
import type { ContextService } from "../../../internal/context/ContextService.js";
import type { DAppConfig } from "../../../internal/dAppConfig/model/dAppConfigTypes.js";
import { EvmBlockchainProvider } from "../../../internal/evm-provider/EvmBlockchainProvider.js";
import { SolanaBlockchainProvider } from "../../../internal/solana-provider/SolanaBlockchainProvider.js";
import { createMockCoreFacade } from "../__mocks__/coreFacadeMock.js";
import { DefaultBlockchainProviderManager } from "./DefaultBlockchainProviderManager.js";

vi.mock("../../../internal/evm-provider/EvmBlockchainProvider.js", () => ({
  EvmBlockchainProvider: vi.fn().mockImplementation(() => ({
    family: "ethereum",
    injectWalletProviders: vi.fn(),
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  })),
}));

vi.mock(
  "../../../internal/solana-provider/SolanaBlockchainProvider.js",
  () => ({
    SolanaBlockchainProvider: vi.fn().mockImplementation(() => ({
      family: "solana",
      injectWalletProviders: vi.fn(),
      setSelectedAccount: vi.fn(),
      setNetwork: vi.fn(),
    })),
  }),
);

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
    vi.mocked(EvmBlockchainProvider).mock.results[0]?.value as {
      injectWalletProviders: ReturnType<typeof vi.fn>;
      setSelectedAccount: ReturnType<typeof vi.fn>;
      setNetwork: ReturnType<typeof vi.fn>;
    };
  const solanaInstance = () =>
    vi.mocked(SolanaBlockchainProvider).mock.results[0]?.value as {
      injectWalletProviders: ReturnType<typeof vi.fn>;
      setSelectedAccount: ReturnType<typeof vi.fn>;
      setNetwork: ReturnType<typeof vi.fn>;
    };

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
});
