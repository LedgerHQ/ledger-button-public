import type {
  BlockchainConfig,
  BlockchainNetwork,
  CoreFacade,
  ProviderAccount,
  ProviderLogger,
} from "@ledgerhq/ledger-wallet-provider-core";
import { vi } from "vitest";

/** Minimal {@link ProviderLogger} stub for tests. */
export function createMockProviderLogger(): ProviderLogger {
  return {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  };
}

/** Fully-stubbed {@link CoreFacade}; `overrides` tune individual methods. */
export function createMockCoreFacade(
  overrides: Partial<CoreFacade> = {},
): CoreFacade {
  return {
    broadcastRPC: vi.fn(),
    requestAccount: vi.fn(),
    requestSwitchChain: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getLogger: vi.fn(() => createMockProviderLogger()),
    getDeviceSession: vi.fn(() => ({
      dmk: {} as never,
      sessionId: undefined,
      isConnected: false,
    })),
    getSdkConfig: vi.fn(() => ({
      originToken: "test-origin-token",
      dAppIdentifier: "test-dapp",
    })),
    isModalOpen: vi.fn(() => false),
    trackTransactionStarted: vi.fn(),
    trackTransactionCompleted: vi.fn(),
    trackTypedMessageStarted: vi.fn(),
    trackTypedMessageCompleted: vi.fn(),
    estimateGasFromCoinService: vi.fn().mockResolvedValue(undefined),
    emitNavigationIntent: vi.fn(),
    trackBroadcastedTransaction: vi.fn(),
    ...overrides,
  };
}

export const XRP_TEST_ACCOUNT: ProviderAccount = {
  id: "xrp-account-0",
  currencyId: "ripple",
  freshAddress: "rKY9CXPdpnkQxQ9N86wcBYz7cFxcXfUG8Y",
  derivationMode: "",
  index: 0,
};

export const XRP_TEST_NETWORK: BlockchainNetwork = {
  id: "0",
  currencyId: "ripple",
  currencyName: "XRP",
  currencyTicker: "XRP",
};

export const XRP_TESTNET_TEST_NETWORK: BlockchainNetwork = {
  id: "1",
  currencyId: "ripple_testnet",
  currencyName: "XRP Testnet",
  currencyTicker: "XRP",
};

/** XRP networks as served by the dApp config. */
export const XRP_TEST_NETWORKS: BlockchainNetwork[] = [
  XRP_TEST_NETWORK,
  XRP_TESTNET_TEST_NETWORK,
];

export const XRP_TEST_BLOCKCHAIN_CONFIG: BlockchainConfig = {
  blockchain: "xrp",
  appName: "XRP",
  networks: XRP_TEST_NETWORKS,
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: { appName: "XRP", dependencies: [{ name: "XRP" }] },
};
