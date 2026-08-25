/**
 * @vitest-environment jsdom
 */

import { Maybe, Right } from "purify-ts";
import { describe, expect, it, vi } from "vitest";

import type { WalletNavigationIntent } from "@api/blockchain-provider/model/types";
import type { BackendService } from "@internal/backend/BackendService";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/ContextService";
import { createMockLoggerFactory } from "@internal/device/__tests__/mocks";
import type { NavigationIntentService } from "@internal/navigation/service/NavigationIntentService";

import { DefaultCoreFacadeService } from "./DefaultCoreFacadeService";

type MakeServiceOpts = {
  environment?: Config["environment"];
  backendService?: BackendService;
};

/**
 * Build a DefaultCoreFacadeService with the minimum viable mocks. Only the
 * dependencies exercised by these tests need real values; the rest are left as
 * empty stubs so that adding or reordering constructor params doesn't break
 * every unrelated slot.
 */
const makeService = (opts: MakeServiceOpts = {}) => {
  const emit = vi.fn();
  const navigationIntentService = {
    emit,
  } as unknown as NavigationIntentService;
  const contextService = {
    getContext: vi.fn().mockReturnValue({ selectedAccounts: new Map() }),
    onEvent: vi.fn(),
  } as unknown as ContextService;
  const blockchainProviderManager = {
    describeNetwork: vi.fn().mockReturnValue(Maybe.empty()),
  } as unknown as BlockchainProviderManager;
  const stub = {} as never;
  const backendService = (opts.backendService ?? stub) as BackendService;
  const config = {
    environment: opts.environment ?? "production",
  } as Config;
  const service = new DefaultCoreFacadeService(
    navigationIntentService,
    contextService,
    blockchainProviderManager,
    backendService,
    stub, // DeviceManagementKitService
    config,
    stub, // ModalService
    stub, // CoinServiceDataSource
    stub, // CalDataSource
    stub, // TrackTransactionStarted
    stub, // TrackTransactionCompleted
    stub, // TrackTypedMessageStarted
    stub, // TrackTypedMessageCompleted
    stub, // TrackBroadcastedTransactionUseCase
    createMockLoggerFactory() as never,
  );

  return { service, emit, contextService, blockchainProviderManager };
};

describe("DefaultCoreFacadeService.requestAccount", () => {
  it("emits a selectAccount intent carrying the requested family", () => {
    const { service, emit } = makeService();

    void service.requestAccount("solana");

    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "selectAccount",
        params: { family: "solana" },
      }),
    );
  });

  it("re-emits the intent with the same family when retried", () => {
    const { service, emit } = makeService();

    void service.requestAccount("ethereum");
    const intent = emit.mock.calls[0][0] as WalletNavigationIntent;
    intent.retry();

    expect(emit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "selectAccount",
        params: { family: "ethereum" },
      }),
    );
  });
});

describe("DefaultCoreFacadeService.broadcastRPC (Solana)", () => {
  it.each(["staging", "production"] as const)(
    "broadcasts Solana requests through the button backend on %s",
    async (environment) => {
      const jsonRpcResponse = { jsonrpc: "2.0", id: 0, result: "signature" };
      const broadcast = vi.fn().mockResolvedValue(Right(jsonRpcResponse));
      const { service } = makeService({
        environment,
        backendService: { broadcast } as unknown as BackendService,
      });

      const args = {
        jsonrpc: "2.0",
        id: 0,
        method: "sendTransaction",
        params: ["base64Tx", { encoding: "base64" }],
      };
      const blockchain = { name: "solana", chainId: "900" };

      const response = await service.broadcastRPC(args, blockchain);

      expect(broadcast).toHaveBeenCalledWith({ blockchain, rpc: args });
      expect(response).toEqual(jsonRpcResponse);
    },
  );
});
