/**
 * @vitest-environment jsdom
 */

import type { WalletNavigationIntent } from "@ledgerhq/ledger-wallet-provider-core";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../components/index.js", () => ({}));

const controllerConstructor = vi.fn();

vi.mock("./select-account-controller.js", () => ({
  SelectAccountController: class {
    constructor(...args: unknown[]) {
      controllerConstructor(...args);
    }
  },
}));

import type { CoreContext } from "../../../context/core-context.js";
import type { LanguageContext } from "../../../context/language-context.js";
import type { Navigation } from "../../../shared/navigation.js";
import { SelectAccountScreen } from "./select-account.js";

function createScreen(params?: WalletNavigationIntent): SelectAccountScreen {
  const screen = new SelectAccountScreen();
  screen.navigation = {} as Navigation;
  (screen as unknown as { coreContext: CoreContext }).coreContext =
    {} as CoreContext;
  (screen as unknown as { languages: LanguageContext }).languages =
    {} as LanguageContext;
  screen.params = params;
  // The mocked controller has no render dependencies; skip Lit's reactive
  // update so connecting the element does not trigger a full template render.
  (screen as unknown as { render: () => unknown }).render = () => undefined;
  return screen;
}

describe("SelectAccountScreen family resolution", () => {
  beforeEach(() => {
    controllerConstructor.mockClear();
  });

  test("passes the requested family to the controller when the intent carries one", () => {
    const intent: WalletNavigationIntent = {
      name: "selectAccount",
      params: { family: "solana" },
    } as unknown as WalletNavigationIntent;

    const screen = createScreen(intent);
    screen.connectedCallback();

    expect(controllerConstructor).toHaveBeenCalledWith(
      screen,
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "solana",
    );
  });

  test("leaves the family undefined when the selection is opened manually", () => {
    const screen = createScreen(undefined);
    screen.connectedCallback();

    expect(controllerConstructor).toHaveBeenCalledWith(
      screen,
      expect.anything(),
      expect.anything(),
      expect.anything(),
      undefined,
    );
  });

  test("leaves the family undefined when the intent has no params", () => {
    const intent = { name: "selectAccount" } as WalletNavigationIntent;

    const screen = createScreen(intent);
    screen.connectedCallback();

    expect(controllerConstructor).toHaveBeenCalledWith(
      screen,
      expect.anything(),
      expect.anything(),
      expect.anything(),
      undefined,
    );
  });
});
