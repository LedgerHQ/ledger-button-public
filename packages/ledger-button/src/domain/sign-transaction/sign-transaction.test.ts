/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../components/index", () => ({}));
vi.mock("../onboarding/ledger-sync/ledger-sync", () => ({}));

import type { ModalGradient } from "../../components/atom/modal/ledger-modal";
import { SignTransactionScreen } from "./sign-transaction";
import type { SignTransactionController } from "./sign-transaction-controller";

type ControllerStub = Pick<SignTransactionController, "state">;

const noopAction = async () => undefined;

function buildScreenState(
  next: "signing" | "success" | "error",
): ControllerStub["state"] {
  if (next === "signing") {
    return { screen: "signing", deviceAnimation: "signTransaction" };
  }
  return {
    screen: next,
    status: {
      title: next,
      message: next,
      cta1: { label: "close", action: noopAction },
    },
  } as ControllerStub["state"];
}

function createScreenWithController(
  initialScreen: "signing" | "success" | "error" = "signing",
): {
  screen: SignTransactionScreen;
  controller: ControllerStub;
  setScreen: (next: "signing" | "success" | "error") => void;
} {
  const controller: ControllerStub = {
    state: buildScreenState(initialScreen),
  };

  const screen = new SignTransactionScreen();
  (screen as unknown as { controller: ControllerStub }).controller = controller;

  const setScreen = (next: "signing" | "success" | "error") => {
    controller.state = buildScreenState(next);
  };

  return { screen, controller, setScreen };
}

function captureGradientEvents(screen: SignTransactionScreen) {
  const events: Array<{
    name: "ledger-status-show" | "ledger-status-hide";
    type?: ModalGradient;
  }> = [];

  screen.addEventListener("ledger-status-show", (event) => {
    const detail = (event as CustomEvent<{ type: ModalGradient }>).detail;
    events.push({ name: "ledger-status-show", type: detail.type });
  });
  screen.addEventListener("ledger-status-hide", () => {
    events.push({ name: "ledger-status-hide" });
  });

  return events;
}

function syncGradient(screen: SignTransactionScreen) {
  (
    screen as unknown as { syncModalGradient: () => void }
  ).syncModalGradient();
}

function clearGradient(screen: SignTransactionScreen) {
  (
    screen as unknown as { clearModalGradient: () => void }
  ).clearModalGradient();
}

describe("SignTransactionScreen modal gradient lifecycle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("dispatches ledger-status-show with success when entering success state", () => {
    const { screen, setScreen } = createScreenWithController("signing");
    const events = captureGradientEvents(screen);

    setScreen("success");
    syncGradient(screen);

    expect(events).toEqual([
      { name: "ledger-status-show", type: "success" },
    ]);
  });

  test("dispatches ledger-status-show with error when entering error state", () => {
    const { screen, setScreen } = createScreenWithController("signing");
    const events = captureGradientEvents(screen);

    setScreen("error");
    syncGradient(screen);

    expect(events).toEqual([{ name: "ledger-status-show", type: "error" }]);
  });

  test("dispatches ledger-status-hide when transitioning back to signing", () => {
    const { screen, setScreen } = createScreenWithController("error");
    const events = captureGradientEvents(screen);

    syncGradient(screen);
    setScreen("signing");
    syncGradient(screen);

    expect(events).toEqual([
      { name: "ledger-status-show", type: "error" },
      { name: "ledger-status-hide" },
    ]);
  });

  test("does not re-dispatch when the same state is synced twice", () => {
    const { screen, setScreen } = createScreenWithController("signing");
    const events = captureGradientEvents(screen);

    setScreen("error");
    syncGradient(screen);
    syncGradient(screen);

    expect(events).toEqual([{ name: "ledger-status-show", type: "error" }]);
  });

  test("does not dispatch hide when no gradient was previously shown", () => {
    const { screen } = createScreenWithController("signing");
    const events = captureGradientEvents(screen);

    clearGradient(screen);

    expect(events).toEqual([]);
  });

  test("disconnectedCallback clears the active gradient", () => {
    const { screen, setScreen } = createScreenWithController("signing");
    const events = captureGradientEvents(screen);

    setScreen("success");
    syncGradient(screen);

    screen.disconnectedCallback();

    expect(events).toEqual([
      { name: "ledger-status-show", type: "success" },
      { name: "ledger-status-hide" },
    ]);
  });
});
