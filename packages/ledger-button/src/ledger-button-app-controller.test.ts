/**
 * @vitest-environment jsdom
 */
import type {
  Account,
  LedgerButtonCore,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerButtonAppController } from "./ledger-button-app-controller.js";

describe("LedgerButtonAppController", () => {
  let host: ReactiveControllerHost;
  let core: LedgerButtonCore;
  let controller: LedgerButtonAppController;

  const account = {
    freshAddress: "0xabc123",
    currencyId: "ethereum",
  } as unknown as Account;

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    core = {
      getActiveSelectedAccount: vi.fn().mockReturnValue(account),
    } as unknown as LedgerButtonCore;

    controller = new LedgerButtonAppController(host, core);
  });

  it("dispatches a provider account-selected event for the active account", () => {
    const listener = vi.fn();
    window.addEventListener("ledger-provider-account-selected", listener);

    controller.setupSelectedAccount();

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent<{
      account: Account;
    }>;
    expect(event.detail.account).toBe(account);

    window.removeEventListener("ledger-provider-account-selected", listener);
  });

  it("does not dispatch when no account is active", () => {
    core.getActiveSelectedAccount = vi.fn().mockReturnValue(undefined);
    const listener = vi.fn();
    window.addEventListener("ledger-provider-account-selected", listener);

    controller.setupSelectedAccount();

    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener("ledger-provider-account-selected", listener);
  });
});
