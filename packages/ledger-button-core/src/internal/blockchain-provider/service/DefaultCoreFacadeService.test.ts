/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import type { WalletNavigationIntent } from "@api/blockchain-provider/model/types.js";
import type { ContextService } from "@internal/context/ContextService.js";
import type { NavigationIntentService } from "@internal/navigation/service/NavigationIntentService.js";

import { DefaultCoreFacadeService } from "./DefaultCoreFacadeService.js";

const makeService = () => {
  const emit = vi.fn();
  const navigationIntentService = {
    emit,
  } as unknown as NavigationIntentService;
  const contextService = {
    getContext: vi.fn().mockReturnValue({ selectedAccounts: new Map() }),
  } as unknown as ContextService;
  const loggerFactory = () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const service = new DefaultCoreFacadeService(
    navigationIntentService,
    contextService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    loggerFactory as never,
  );

  return { service, emit };
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

describe("DefaultCoreFacadeService.broadcastRPC (Solana temporary path)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("broadcasts Solana requests directly to the Ledger Solana node proxy", async () => {
    const { service } = makeService();
    const jsonRpcResponse = { jsonrpc: "2.0", id: 0, result: "signature" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(jsonRpcResponse),
    });
    vi.stubGlobal("fetch", fetchMock);

    const args = {
      jsonrpc: "2.0",
      id: 0,
      method: "sendTransaction",
      params: ["base64Tx", { encoding: "base64" }],
    };

    const response = await service.broadcastRPC(args, {
      name: "solana",
      chainId: "mainnet",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://solana.coin.ledger.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    expect(response).toEqual(jsonRpcResponse);
  });

  it("fails with the HTTP status when the Solana node proxy rejects the request", async () => {
    const { service } = makeService();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: vi.fn(),
      }),
    );

    await expect(
      service.broadcastRPC(
        { jsonrpc: "2.0", id: 0, method: "sendTransaction", params: [] },
        { name: "solana", chainId: "mainnet" },
      ),
    ).rejects.toThrow("Solana node proxy responded with 429 Too Many Requests");
  });
});
