/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../components/index", () => ({}));

const controllerConstructor = vi.fn();

vi.mock("./select-account-controller", () => ({
  SelectAccountController: class {
    constructor(...args: unknown[]) {
      controllerConstructor(...args);
    }
  },
}));

import type { CoreContext } from "../../../context/core-context";
import type { LanguageContext } from "../../../context/language-context";
import type { Navigation } from "../../../shared/navigation";
import type { SelectAccountNavigationParams } from "../../../shared/root-navigation-controller";
import { SelectAccountScreen } from "./select-account";

function createScreen(
  params?: SelectAccountNavigationParams,
): SelectAccountScreen {
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
    const intent: SelectAccountNavigationParams = {
      name: "selectAccount",
      params: { family: "solana" },
    };

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
    const intent = {
      name: "selectAccount",
    } as SelectAccountNavigationParams;

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
