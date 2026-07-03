/**
 * @vitest-environment jsdom
 */
import type { PendingTransaction } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { BehaviorSubject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreContext } from "../../../context/core-context.js";
import { FloatingButtonController } from "./ledger-floating-button-controller.js";

function createPendingTx(
  overrides: Partial<PendingTransaction> = {},
): PendingTransaction {
  return {
    hash: "0xpending1",
    chainId: 1,
    address: "0xabc123",
    timestamp: "2026-04-08T10:00:00.000Z",
    type: "sent",
    value: "1000000000000000000",
    formattedValue: "1 ETH",
    ticker: "ETH",
    currencyName: "Ethereum",
    ledgerId: "ethereum",
    ...overrides,
  };
}

const account1 = { freshAddress: "0xabc123", currencyId: "ethereum" };
const account2 = { freshAddress: "0xdef456", currencyId: "ethereum" };

describe("FloatingButtonController", () => {
  let host: ReactiveControllerHost;
  let core: CoreContext;
  let pendingTxSubject: BehaviorSubject<PendingTransaction[]>;
  let contextSubject: BehaviorSubject<Record<string, unknown>>;
  let controller: FloatingButtonController;

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    pendingTxSubject = new BehaviorSubject<PendingTransaction[]>([]);
    contextSubject = new BehaviorSubject<Record<string, unknown>>({
      selectedAccounts: new Map([["ethereum", account1]]),
    });

    core = {
      observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
      observePendingTransactions: vi
        .fn()
        .mockReturnValue(pendingTxSubject.asObservable()),
      getSelectedAccount: vi.fn().mockReturnValue({ id: "acc-1" }),
    } as unknown as CoreContext;

    controller = new FloatingButtonController(host, core);
  });

  describe("validated celebration when pending count decreases", () => {
    it("should set celebration flags when a single pending tx is confirmed", () => {
      const tx = createPendingTx();
      pendingTxSubject.next([tx]);
      controller.hostConnected();

      pendingTxSubject.next([]);

      expect(controller.validatedCelebrationOpen).toBe(true);
      expect(controller.validatedCount).toBe(1);
      expect(controller.pendingTransactionCount).toBe(0);
    });

    it("should set validatedCount to the delta when multiple txs confirm at once", () => {
      const tx1 = createPendingTx({ hash: "0xa" });
      const tx2 = createPendingTx({ hash: "0xb" });
      const tx3 = createPendingTx({ hash: "0xc" });
      pendingTxSubject.next([tx1, tx2, tx3]);
      controller.hostConnected();

      pendingTxSubject.next([tx3]);

      expect(controller.validatedCelebrationOpen).toBe(true);
      expect(controller.validatedCount).toBe(2);
      expect(controller.pendingTransactionCount).toBe(1);
    });

    it("should clear post-close pending tooltip when celebration starts", () => {
      const tx = createPendingTx();
      pendingTxSubject.next([tx]);
      controller.hostConnected();

      controller.postClosePendingTooltipOpen = true;

      pendingTxSubject.next([]);

      expect(controller.postClosePendingTooltipOpen).toBe(false);
      expect(controller.validatedCelebrationOpen).toBe(true);
    });

    it("should not celebrate on first emission without a prior count", () => {
      controller.hostConnected();

      expect(controller.validatedCelebrationOpen).toBe(false);
      expect(controller.validatedCount).toBe(0);
    });
  });

  describe("toast confirmation mode", () => {
    beforeEach(() => {
      controller = new FloatingButtonController(host, core, "toast");
    });

    it("should not open validated celebration when pending count decreases", () => {
      const tx = createPendingTx();
      pendingTxSubject.next([tx]);
      controller.hostConnected();

      pendingTxSubject.next([]);

      expect(controller.validatedCelebrationOpen).toBe(false);
      expect(controller.validatedCount).toBe(0);
      expect(controller.pendingTransactionCount).toBe(0);
    });
  });

  describe("clearValidatedCelebration", () => {
    it("should reset celebration state", () => {
      const tx = createPendingTx();
      pendingTxSubject.next([tx]);
      controller.hostConnected();
      pendingTxSubject.next([]);

      controller.clearValidatedCelebration();

      expect(controller.validatedCelebrationOpen).toBe(false);
      expect(controller.validatedCount).toBe(0);
    });
  });

  describe("disconnect", () => {
    it("should clear celebration when account is cleared", () => {
      const tx = createPendingTx();
      pendingTxSubject.next([tx]);
      controller.hostConnected();
      pendingTxSubject.next([]);

      expect(controller.validatedCelebrationOpen).toBe(true);

      vi.mocked(core.getSelectedAccount).mockReturnValue(undefined);
      contextSubject.next({ selectedAccounts: new Map() });

      expect(controller.validatedCelebrationOpen).toBe(false);
      expect(controller.validatedCount).toBe(0);
    });

    it("should clear celebration on hostDisconnected", () => {
      const tx = createPendingTx();
      pendingTxSubject.next([tx]);
      controller.hostConnected();
      pendingTxSubject.next([]);

      controller.hostDisconnected();

      expect(controller.validatedCelebrationOpen).toBe(false);
      expect(controller.validatedCount).toBe(0);
    });
  });

  describe("per-account pending count", () => {
    it("only counts pending txs that belong to the selected account", () => {
      const txAccount1 = createPendingTx({
        hash: "0x1",
        address: account1.freshAddress,
      });
      const txAccount2 = createPendingTx({
        hash: "0x2",
        address: account2.freshAddress,
      });
      pendingTxSubject.next([txAccount1, txAccount2]);
      controller.hostConnected();

      expect(controller.pendingTransactionCount).toBe(1);
    });

    it("ignores pending txs whose currency differs from the selected account", () => {
      const sameAddressOtherChain = createPendingTx({
        hash: "0x1",
        address: account1.freshAddress,
        ledgerId: "polygon",
      });
      pendingTxSubject.next([sameAddressOtherChain]);
      controller.hostConnected();

      expect(controller.pendingTransactionCount).toBe(0);
    });

    it("recomputes the count when the user switches account and does not fire the celebration", () => {
      const txAccount1 = createPendingTx({
        hash: "0x1",
        address: account1.freshAddress,
      });
      pendingTxSubject.next([txAccount1]);
      controller.hostConnected();
      expect(controller.pendingTransactionCount).toBe(1);

      contextSubject.next({ selectedAccounts: new Map([["ethereum", account2]]) });

      expect(controller.pendingTransactionCount).toBe(0);
      expect(controller.validatedCelebrationOpen).toBe(false);
      expect(controller.validatedCount).toBe(0);
      expect(controller.frozenBadgeCount).toBeNull();
    });

    it("still fires the celebration when the active account's last pending tx is confirmed", () => {
      const txAccount1 = createPendingTx({
        hash: "0x1",
        address: account1.freshAddress,
      });
      const txAccount2 = createPendingTx({
        hash: "0x2",
        address: account2.freshAddress,
      });
      pendingTxSubject.next([txAccount1, txAccount2]);
      controller.hostConnected();
      expect(controller.pendingTransactionCount).toBe(1);

      pendingTxSubject.next([txAccount2]);

      expect(controller.pendingTransactionCount).toBe(0);
      expect(controller.validatedCelebrationOpen).toBe(true);
      expect(controller.validatedCount).toBe(1);
    });
  });
});
