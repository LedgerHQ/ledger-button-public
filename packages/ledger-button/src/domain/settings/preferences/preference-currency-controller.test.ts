import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PreferenceCurrencyController } from "./preference-currency-controller.js";

function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

describe("PreferenceCurrencyController", () => {
  let host: ReactiveControllerHost;

  beforeEach(() => {
    host = createMockHost();
  });

  it("should register itself with the host", () => {
    new PreferenceCurrencyController(host);

    expect(host.addController).toHaveBeenCalledWith(expect.any(Object));
  });

  describe("currencies", () => {
    it("should expose the list of supported currencies", () => {
      const controller = new PreferenceCurrencyController(host);

      expect(controller.currencies).toEqual(["usd", "eur", "gbp"]);
    });

    it("should always return the same reference", () => {
      const controller = new PreferenceCurrencyController(host);

      expect(controller.currencies).toBe(controller.currencies);
    });
  });
});
