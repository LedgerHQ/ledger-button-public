/**
 * @vitest-environment jsdom
 */

import type {
  BroadcastTracking,
  SignFlowStatus,
  SignNavigationIntent,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { Subject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../components/index", () => ({}));
vi.mock("../onboarding/ledger-sync/ledger-sync", () => ({}));

import type { CoreContext } from "../../context/core-context";
import type { LanguageContext } from "../../context/language-context";
import type { Navigation } from "../../shared/navigation";
import { SignTransactionController } from "./sign-transaction-controller";

describe("SignTransactionController broadcast lifecycle", () => {
  let controller: SignTransactionController;
  let host: ReactiveControllerHost;
  let core: CoreContext;
  let navigation: Navigation;
  let lang: LanguageContext;
  let signFlowSubject: Subject<SignFlowStatus>;
  let broadcastSubject: Subject<BroadcastTracking>;
  let mockIntent: SignNavigationIntent;

  const broadcastSuccessResult: SignFlowStatus = {
    signType: "transaction",
    status: "success",
    data: {
      hash: "0xabc",
      rawTransaction: new Uint8Array(),
      signedRawTransaction: "0x",
    },
  };

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    signFlowSubject = new Subject<SignFlowStatus>();
    broadcastSubject = new Subject<BroadcastTracking>();

    mockIntent = {
      name: "signTransaction",
      params: { family: "ethereum", type: "transaction", broadcast: true },
      status$: signFlowSubject.asObservable(),
      finish: vi.fn(),
      retry: vi.fn(),
    };

    core = {
      observeBroadcastedTransaction: vi
        .fn()
        .mockReturnValue(broadcastSubject.asObservable()),
      getActiveSelectedAccount: vi.fn().mockReturnValue(undefined),
      trackViewTransactionDetailsClicked: vi.fn(),
    } as unknown as CoreContext;

    navigation = {
      navigateTo: vi.fn(),
      navigateBack: vi.fn(),
      host: {},
    } as unknown as Navigation;

    lang = {
      currentTranslation: {
        common: {
          button: { close: "Close" },
          device: { model: { fallback: "Ledger" } },
        },
        signMessage: {
          success: {
            title: "Message signed",
            description: "Message signature successful",
          },
        },
        signTransaction: {
          success: {
            title: "Transaction sent",
            description: "Transaction was broadcast successfully",
            viewTransaction: "View transaction",
          },
        },
      },
    } as unknown as LanguageContext;

    controller = new SignTransactionController(host, core, navigation, lang);
  });

  it("shows processing until core reports the transaction as validated", () => {
    controller.startSigning(mockIntent);
    signFlowSubject.next(broadcastSuccessResult);

    expect(controller.state.screen).toBe("success");
    if (controller.state.screen !== "success") {
      throw new Error("Expected success state");
    }
    expect(controller.state.broadcast?.state).toBe("processing");
    expect(core.observeBroadcastedTransaction).toHaveBeenCalledWith("0xabc");

    broadcastSubject.next({ hash: "0xabc", state: "processing" });

    if (controller.state.screen !== "success") {
      throw new Error("Expected success state");
    }
    expect(controller.state.broadcast?.state).toBe("processing");

    broadcastSubject.next({ hash: "0xabc", state: "validated" });

    if (controller.state.screen !== "success") {
      throw new Error("Expected success state");
    }
    expect(controller.state.broadcast?.state).toBe("validated");
  });

  it("exposes the explorer CTA only once core has resolved the link", () => {
    controller.startSigning(mockIntent);
    signFlowSubject.next(broadcastSuccessResult);

    if (controller.state.screen !== "success") {
      throw new Error("Expected success state");
    }
    expect(controller.state.status.cta2).toBeUndefined();

    broadcastSubject.next({
      hash: "0xabc",
      state: "processing",
      explorerUrl: "https://etherscan.io/tx/0xabc",
    });

    if (controller.state.screen !== "success") {
      throw new Error("Expected success state");
    }
    expect(controller.state.status.cta2?.label).toBe("View transaction");
  });

  it("uses the message copy when the intent describes a message", () => {
    controller.startSigning({
      ...mockIntent,
      params: { family: "ethereum", type: "message", broadcast: false },
    });
    signFlowSubject.next({
      signType: "personal-sign",
      status: "success",
      data: { signature: "0xsig" },
    });

    if (controller.state.screen !== "success") {
      throw new Error("Expected success state");
    }
    expect(controller.state.status.title).toBe("Message signed");
    expect(controller.state.broadcast).toBeUndefined();
    expect(core.observeBroadcastedTransaction).not.toHaveBeenCalled();
  });
});
