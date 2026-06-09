/**
 * @vitest-environment jsdom
 */

import type { Wallet } from "@wallet-standard/base";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { registerWalletStandard } from "./registerWalletStandard.js";

const wallet = { name: "Ledger" } as unknown as Wallet;

const cleanups: (() => void)[] = [];

/** Registers the wallet and ensures its listeners are torn down after the test. */
function register(): () => void {
  const unregister = registerWalletStandard(wallet);
  cleanups.push(unregister);
  return unregister;
}

/**
 * Minimal stand-in for a Wallet Standard app: it listens for the wallet's
 * `register-wallet` event and hands back a register function that returns a spy
 * unregister callback, exactly like `@wallet-standard/app` does.
 */
function createApp() {
  const unregister = vi.fn();
  const registerWithApp = vi.fn().mockReturnValue(unregister);

  const onRegisterWallet = (event: Event) => {
    (
      event as CustomEvent<(api: { register: typeof registerWithApp }) => void>
    ).detail({ register: registerWithApp });
  };
  window.addEventListener("wallet-standard:register-wallet", onRegisterWallet);

  return {
    register: registerWithApp,
    unregister,
    /** Simulates the app becoming ready after the wallet already registered. */
    announceReady: () => {
      window.dispatchEvent(
        new CustomEvent("wallet-standard:app-ready", {
          detail: { register: registerWithApp },
        }),
      );
    },
    dispose: () => {
      window.removeEventListener(
        "wallet-standard:register-wallet",
        onRegisterWallet,
      );
    },
  };
}

describe("registerWalletStandard", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    app.dispose();
  });

  test("registers the wallet with an already-present app", () => {
    register();

    expect(app.register).toHaveBeenCalledWith(wallet);
  });

  test("registers the wallet when the app becomes ready later", () => {
    const lateApp = createApp();
    // Drop the eagerly-listening app so only the late one responds.
    app.dispose();

    register();
    lateApp.announceReady();

    expect(lateApp.register).toHaveBeenCalledWith(wallet);

    lateApp.dispose();
  });

  test("unregister tears the wallet down via the app-provided callback", () => {
    const unregister = register();

    unregister();

    expect(app.unregister).toHaveBeenCalledTimes(1);
  });

  test("after unregister, a later app-ready does not re-register the wallet", () => {
    const unregister = register();
    app.register.mockClear();

    unregister();
    app.announceReady();

    expect(app.register).not.toHaveBeenCalled();
  });
});
