import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreFacade } from "./model/BlockchainProvider.js";
import { DefaultBlockchainProviderManager } from "./service/DefaultBlockchainProviderManager.js";
import type { Account } from "../account/service/AccountService.js";
import type { ContextService } from "../context/ContextService.js";
import type { DAppConfigV2 } from "../dAppConfig/v2/model/dAppConfigV2Types.js";
import type { EvmBlockchainProviderFactory } from "../evm-provider/EvmBlockchainProvider.js";
import { SolanaBlockchainProvider } from "../solana-provider/SolanaBlockchainProvider.js";

vi.mock("../solana-provider/SolanaBlockchainProvider.js", () => ({
  SolanaBlockchainProvider: vi.fn().mockImplementation(() => ({
    family: "solana",
    injectWalletProviders: vi.fn(),
    setSelectedAccount: vi.fn(),
    setNetwork: vi.fn(),
  })),
}));

const createMockEvmProvider = () => ({
  family: "evm" as const,
  injectWalletProviders: vi.fn(),
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

const createMockDAppConfig = (): DAppConfigV2 =>
  ({
    name: "test",
    liveAppId: "test",
    domainUrl: "test",
    referralUrl: "test",
    blockchains: [],
    featureFlags: {},
  }) as DAppConfigV2;

const createMockCore = (): CoreFacade => ({
  broadcastRPC: vi.fn(),
  requestAccount: vi.fn(),
  requestSwitchChain: vi.fn(),
  disconnect: vi.fn(),
});

const createMockContextService = (
  account?: Account,
  chainId = 1,
): ContextService => ({
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
});

describe("DefaultBlockchainProviderManager", () => {
  let manager: DefaultBlockchainProviderManager;
  let core: CoreFacade;
  let dappConfig: DAppConfigV2;
  let evmProvider: ReturnType<typeof createMockEvmProvider>;
  let createEvmProvider: ReturnType<typeof vi.fn> &
    EvmBlockchainProviderFactory;

  beforeEach(() => {
    vi.clearAllMocks();
    const contextService = createMockContextService();

    evmProvider = createMockEvmProvider();
    createEvmProvider = vi
      .fn()
      .mockReturnValue(evmProvider) as unknown as ReturnType<typeof vi.fn> &
      EvmBlockchainProviderFactory;

    manager = new DefaultBlockchainProviderManager(
      contextService,
      createEvmProvider,
      loggerFactory as any,
    );
    core = createMockCore();
    dappConfig = createMockDAppConfig();
  });

  describe("init()", () => {
    it("creates providers with core and dappConfig", () => {
      manager.init(core, dappConfig);

      expect(createEvmProvider).toHaveBeenCalledWith(core, dappConfig);
      expect(SolanaBlockchainProvider).toHaveBeenCalledWith(core, dappConfig);
    });

    it("calls injectWalletProviders on each provider", () => {
      manager.init(core, dappConfig);

      const solanaInstance = vi.mocked(SolanaBlockchainProvider).mock.results[0]
        ?.value;

      expect(evmProvider.injectWalletProviders).toHaveBeenCalledOnce();
      expect(solanaInstance.injectWalletProviders).toHaveBeenCalledOnce();
    });

    it("pushes initial context to providers after wiring", () => {
      const account = { currencyId: "ethereum" } as Account;
      const contextService = createMockContextService(account, 137);

      manager = new DefaultBlockchainProviderManager(
        contextService,
        createEvmProvider,
        loggerFactory as any,
      );

      manager.init(core, dappConfig);

      expect(evmProvider.setSelectedAccount).toHaveBeenCalledWith(account);
      expect(evmProvider.setNetwork).toHaveBeenCalledWith(137);
    });
  });

  describe("setSelectedAccount()", () => {
    it("fans out to every provider", () => {
      manager.init(core, dappConfig);
      const solanaInstance = vi.mocked(SolanaBlockchainProvider).mock.results[0]
        ?.value;

      const account = { currencyId: "ethereum" } as Account;
      manager.setSelectedAccount(account);

      expect(evmProvider.setSelectedAccount).toHaveBeenCalledWith(account);
      expect(solanaInstance.setSelectedAccount).toHaveBeenCalledWith(account);
    });
  });

  describe("setNetwork()", () => {
    it("fans out to every provider", () => {
      manager.init(core, dappConfig);

      manager.setNetwork(137);

      expect(evmProvider.setNetwork).toHaveBeenCalledWith(137);
    });
  });
});
