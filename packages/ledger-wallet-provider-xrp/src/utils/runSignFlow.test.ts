import type {
  SignedResults,
  SignFlowStatus,
} from "@ledgerhq/ledger-wallet-provider-core";
import { UserRejectedTransactionError } from "@ledgerhq/ledger-wallet-provider-core";
import { Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import {
  createMockCoreFacade,
  createMockProviderLogger,
} from "../__mocks__/coreFacadeMock";
import { runSignFlow } from "./runSignFlow";

type NavigationIntent = { finish: () => void; retry: () => void };

function startFlow() {
  const core = createMockCoreFacade();
  const status$ = new Subject<SignFlowStatus>();
  const promise = runSignFlow({
    core,
    logger: createMockProviderLogger(),
    runUseCase: () => status$,
    mapResult: (data: SignedResults) => data,
  });
  const intent = vi.mocked(core.emitNavigationIntent).mock
    .calls[0]?.[0] as unknown as NavigationIntent;
  return { promise, intent, status$ };
}

describe("runSignFlow", () => {
  it("rejects when the modal finishes the flow after an error", async () => {
    const { promise, intent, status$ } = startFlow();

    status$.next({
      signType: "transaction",
      status: "error",
      error: new Error("device locked"),
    });
    intent.finish();

    await expect(promise).rejects.toBeInstanceOf(UserRejectedTransactionError);
  });

  it("keeps the result when the modal finishes the flow after a success", async () => {
    const { promise, intent, status$ } = startFlow();
    const data = { xrpSignature: new Uint8Array([1]) } as never;

    status$.next({ signType: "transaction", status: "success", data });
    intent.finish();

    await expect(promise).resolves.toBe(data);
  });
});
