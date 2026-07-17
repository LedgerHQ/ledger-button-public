/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";

import type { WalletNavigationIntent } from "../../../api/blockchain-provider/model/types.js";
import type { ContextService } from "../../context/ContextService.js";
import type { NavigationIntentService } from "../../navigation/service/NavigationIntentService.js";
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
