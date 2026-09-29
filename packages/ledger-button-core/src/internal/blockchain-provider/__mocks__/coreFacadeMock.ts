import { vi } from "vitest";

import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade";
import type { ProviderLogger } from "@api/model/blockchain/ProviderLogger";

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

/**
 * Builds a fully-stubbed {@link CoreFacade} for tests. Pass `overrides` to tune
 * the behaviour of individual methods.
 */
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
