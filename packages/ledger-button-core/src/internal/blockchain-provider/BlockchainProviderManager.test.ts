import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockCoreFacade } from "./__mocks__/coreFacadeMock.js";
import type { CoreFacade } from "./model/CoreFacade.js";
import { DefaultBlockchainProviderManager } from "./service/DefaultBlockchainProviderManager.js";
import type { BlockchainConfig } from "../../api/model/dappConfig/BlockchainConfig.js";
import type { Account } from "../account/service/AccountService.js";
import type { ContextService } from "../context/ContextService.js";
import type { DAppConfigV2 } from "../dAppConfig/v2/model/dAppConfigV2Types.js";
import { EvmBlockchainProvider } from "../evm-provider/EvmBlockchainProvider.js";
import { SolanaBlockchainProvider } from "../solana-provider/SolanaBlockchainProvider.js";

vi.mock("../evm-provider/EvmBlockchainProvider.js", () => ({
  EvmBlockchainProvider: vi.fn().mockImplementation(() => ({
    family: "evm",
    injectWalletProviders: vi.fn(),
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  })),
}));

vi.mock("../solana-provider/SolanaBlockchainProvider.js", () => ({
  SolanaBlockchainProvider: vi.fn().mockImplementation(() => ({
    family: "solana",
    injectWalletProviders: vi.fn(),
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  })),
}));

const evmConfig: BlockchainConfig = {
  blockchain: "evm",
  appName: "Ethereum",
  networks: [],
  appDependencies: { appName: "Ethereum", dependencies: [] },
};

const solanaConfig: BlockchainConfig = {
  blockchain: "solana",
  appName: "Solana",
  networks: [],
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

const createMockDAppConfig = (): DAppConfigV2 =>
  ({
    name: "test",
    liveAppId: "test",
    domainUrl: "test",
    referralUrl: "test",
    blockchains: [evmConfig, solanaConfig],
    featureFlags: {},
  }) as DAppConfigV2;

const createMockContextService = (
  account?: Account,
  chainId = 1,
): ContextService =>
  ({
    getContext: vi.fn().mockReturnValue({ selectedAccount: account, chainId }),
    observeContext: vi.fn().mockReturnValue({
      subscribe: vi.fn(
        (
          cb: (ctx: {
            selectedAccount: Account | undefined;
            chainId: number;
          }) => void,
        ) => {
          cb({ selectedAccount: account, chainId });
        },
      ),
    }),
    onEvent: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

describe("DefaultBlockchainProviderManager", () => {
  let manager: DefaultBlockchainProviderManager;
  let core: CoreFacade;
  let dappConfig: DAppConfigV2;

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

  describe("setSelectedAccount()", () => {
    it("fans out to every provider", () => {
      manager.init(core, dappConfig);

      const account = { currencyId: "ethereum" } as Account;
      manager.setSelectedAccount(account);

      expect(evmInstance().setSelectedAccount).toHaveBeenCalledWith(account);
      expect(solanaInstance().setSelectedAccount).toHaveBeenCalledWith(account);
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
