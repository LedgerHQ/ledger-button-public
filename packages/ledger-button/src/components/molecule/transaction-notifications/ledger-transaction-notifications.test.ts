/**
 * @vitest-environment jsdom
 */

import "../../atom/toast/ledger-toast";
import "./ledger-transaction-notifications";

import { afterEach, describe, expect, it, vi } from "vitest";

import { LedgerTransactionNotifications } from "./ledger-transaction-notifications";

function mountNotifications(): LedgerTransactionNotifications {
  const host = document.createElement(
    "ledger-transaction-notifications",
  ) as LedgerTransactionNotifications;
  document.body.appendChild(host);

  return host;
}

async function flushNotifications(
  host: LedgerTransactionNotifications,
): Promise<void> {
  await host.updateComplete;
}

describe("ledger-transaction-notifications", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("push adds a notification and returns its id", async () => {
    const host = mountNotifications();
    await flushNotifications(host);

    const id = host.push({
      variant: "success",
      title: "Transaction confirmed",
      autoDismiss: false,
    });

    await flushNotifications(host);

    expect(host.notifications).toHaveLength(1);
    expect(host.notifications[0]?.id).toBe(id);
    expect(host.renderRoot.querySelectorAll("ledger-toast")).toHaveLength(1);
  });

  it("push uses a caller-provided id", async () => {
    const host = mountNotifications();
    await flushNotifications(host);

    const id = host.push({
      id: "custom-toast-id",
      variant: "fail",
      title: "Transaction failed",
      autoDismiss: false,
    });

    expect(id).toBe("custom-toast-id");
    expect(host.notifications[0]?.id).toBe("custom-toast-id");
  });

  it("dismiss removes a notification by id", async () => {
    const host = mountNotifications();
    await flushNotifications(host);

    const firstId = host.push({
      variant: "success",
      title: "First",
      autoDismiss: false,
    });
    host.push({
      variant: "fail",
      title: "Second",
      autoDismiss: false,
    });
    await flushNotifications(host);

    host.dismiss(firstId);
    await flushNotifications(host);

    expect(host.notifications).toHaveLength(1);
    expect(host.notifications[0]?.title).toBe("Second");
  });

  it("clear removes all notifications", async () => {
    const host = mountNotifications();
    await flushNotifications(host);

    host.push({ variant: "success", title: "First", autoDismiss: false });
    host.push({ variant: "fail", title: "Second", autoDismiss: false });
    await flushNotifications(host);

    host.clear();
    await flushNotifications(host);

    expect(host.notifications).toHaveLength(0);
    expect(host.renderRoot.querySelectorAll("ledger-toast")).toHaveLength(0);
  });

  it("removes a notification when its toast dispatches ledger-toast-close", async () => {
    const host = mountNotifications();
    await flushNotifications(host);

    const firstId = host.push({
      variant: "success",
      title: "First",
      autoDismiss: false,
    });
    host.push({
      variant: "success",
      title: "Second",
      autoDismiss: false,
    });
    await flushNotifications(host);

    const toasts = host.renderRoot.querySelectorAll("ledger-toast");
    toasts[1]?.dispatchEvent(
      new CustomEvent("ledger-toast-close", {
        bubbles: true,
        composed: true,
      }),
    );
    await flushNotifications(host);

    expect(host.notifications).toHaveLength(1);
    expect(host.notifications[0]?.id).toBe(firstId);
  });

  it("generates ids with crypto.randomUUID", async () => {
    const uuid = "00000000-0000-4000-8000-000000000001";
    vi.spyOn(crypto, "randomUUID").mockReturnValue(uuid);

    const host = mountNotifications();
    await flushNotifications(host);

    const id = host.push({
      variant: "success",
      title: "Generated id",
      autoDismiss: false,
    });

    expect(id).toBe(`tx-toast-${uuid}`);
  });
});
