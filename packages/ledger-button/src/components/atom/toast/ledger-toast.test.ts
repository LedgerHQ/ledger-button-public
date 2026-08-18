/**
 * @vitest-environment jsdom
 */

import "../icon/ledger-icon";
import "./ledger-toast";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { LedgerIcon } from "../icon/ledger-icon";
import {
  LedgerToast,
  TOAST_COLLAPSE_DURATION_MS,
  TOAST_FADE_DURATION_MS,
} from "./ledger-toast";

const PHASE_FALLBACK_BUFFER_MS = 50;

function mountToast(overrides: Partial<LedgerToast> = {}): LedgerToast {
  const toast = document.createElement("ledger-toast") as LedgerToast;
  toast.title = "Transaction confirmed";
  toast.autoDismiss = false;
  Object.assign(toast, overrides);
  document.body.appendChild(toast);

  return toast;
}

async function flushToast(toast: LedgerToast): Promise<void> {
  await toast.updateComplete;
}

function getCloseButton(toast: LedgerToast): HTMLButtonElement {
  const button = toast.shadowRoot?.querySelector("button[aria-label='Close']");

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Close button not found");
  }

  return button;
}

function getStatusIcon(toast: LedgerToast): LedgerIcon {
  const icons = [
    ...(toast.shadowRoot?.querySelectorAll("ledger-icon") ?? []),
  ] as LedgerIcon[];
  const statusIcon = icons.find(
    (icon) =>
      icon.type === "checkMarkCircleFill" || icon.type === "deleteCircleFill",
  );

  if (!statusIcon) {
    throw new Error("Status icon not found");
  }

  return statusIcon;
}

function dispatchTransitionEnd(toast: LedgerToast, propertyName: string): void {
  toast.dispatchEvent(
    new TransitionEvent("transitionend", {
      propertyName,
      bubbles: false,
    }),
  );
}

function runCloseAnimation(toast: LedgerToast): void {
  dispatchTransitionEnd(toast, "opacity");
  dispatchTransitionEnd(toast, "max-height");
}

function stubTransitionEvent(): void {
  if (typeof globalThis.TransitionEvent !== "undefined") {
    return;
  }

  class TransitionEventPolyfill extends Event implements TransitionEvent {
    readonly propertyName: string;

    readonly elapsedTime = 0;

    readonly pseudoElement = "";

    constructor(type: string, init?: TransitionEventInit) {
      super(type, init);
      this.propertyName = init?.propertyName ?? "";
    }
  }

  vi.stubGlobal("TransitionEvent", TransitionEventPolyfill);
}

describe("ledger-toast", () => {
  beforeEach(() => {
    stubTransitionEvent();
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);

      return 1;
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sets data-state to open after mount", async () => {
    const toast = mountToast();

    await flushToast(toast);

    expect(toast.dataset.state).toBe("open");
  });

  it("renders title, description, and success icon", async () => {
    const toast = mountToast({
      description: "0.2873 ETH → 293.39 USDC",
    });

    await flushToast(toast);

    expect(toast.shadowRoot?.textContent).toContain("Transaction confirmed");
    expect(toast.shadowRoot?.textContent).toContain("0.2873 ETH → 293.39 USDC");
    expect(getStatusIcon(toast).type).toBe("checkMarkCircleFill");
  });

  it("renders fail variant icon", async () => {
    const toast = mountToast({ variant: "fail" });

    await flushToast(toast);

    expect(getStatusIcon(toast).type).toBe("deleteCircleFill");
  });

  it("hides the close button when not dismissible", async () => {
    const toast = mountToast({ dismissible: false });

    await flushToast(toast);

    expect(
      toast.shadowRoot?.querySelector("button[aria-label='Close']"),
    ).toBeNull();
  });

  it("dispatches ledger-toast-link-click when the explorer link is clicked", async () => {
    const toast = mountToast({
      linkText: "View on explorer",
      linkHref: "https://etherscan.io",
    });
    const linkClickHandler = vi.fn();
    toast.addEventListener("ledger-toast-link-click", linkClickHandler);

    await flushToast(toast);

    const link = toast.shadowRoot?.querySelector("a");

    link?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(linkClickHandler).toHaveBeenCalledOnce();
    expect(linkClickHandler.mock.calls[0][0].detail).toEqual({
      variant: "success",
      title: "Transaction confirmed",
      href: "https://etherscan.io",
    });
  });

  it("dispatches ledger-toast-closing when the user closes the toast", async () => {
    const toast = mountToast();
    const closingHandler = vi.fn();
    toast.addEventListener("ledger-toast-closing", closingHandler);

    await flushToast(toast);

    getCloseButton(toast).click();

    expect(toast.dataset.state).toBe("closing");
    expect(closingHandler).toHaveBeenCalledOnce();
    expect(closingHandler.mock.calls[0][0].detail.reason).toBe("user");
  });

  it("runs fade then collapse before dispatching ledger-toast-close", async () => {
    const toast = mountToast();
    const closeHandler = vi.fn();
    toast.addEventListener("ledger-toast-close", closeHandler);

    await flushToast(toast);

    getCloseButton(toast).click();

    expect(toast.dataset.state).toBe("closing");
    expect(closeHandler).not.toHaveBeenCalled();

    runCloseAnimation(toast);

    expect(toast.dataset.state).toBe("closed");
    expect(closeHandler).toHaveBeenCalledOnce();
    expect(closeHandler.mock.calls[0][0].detail.reason).toBe("user");
  });

  it("completes close using phase fallback timers when transitionend is missed", async () => {
    const toast = mountToast();
    const closeHandler = vi.fn();
    toast.addEventListener("ledger-toast-close", closeHandler);

    await flushToast(toast);

    getCloseButton(toast).click();

    await vi.advanceTimersByTimeAsync(
      TOAST_FADE_DURATION_MS +
        PHASE_FALLBACK_BUFFER_MS +
        TOAST_COLLAPSE_DURATION_MS +
        PHASE_FALLBACK_BUFFER_MS,
    );

    expect(toast.dataset.state).toBe("closed");
    expect(closeHandler).toHaveBeenCalledOnce();
  });

  it("auto-dismisses after duration with reason timeout", async () => {
    const toast = mountToast({
      autoDismiss: true,
      duration: 2000,
    });
    const closeHandler = vi.fn();
    toast.addEventListener("ledger-toast-close", closeHandler);

    await flushToast(toast);

    await vi.advanceTimersByTimeAsync(2000);
    runCloseAnimation(toast);

    expect(closeHandler).toHaveBeenCalledOnce();
    expect(closeHandler.mock.calls[0][0].detail.reason).toBe("timeout");
  });
});
