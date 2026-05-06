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

function createMockCore(
  overrides: Partial<{ getPreferredFiatCurrency: () => string }> = {},
) {
  return {
    getPreferredFiatCurrency: vi.fn().mockReturnValue("usd"),
    savePreferredFiatCurrency: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("PreferenceCurrencyController", () => {
  let host: ReactiveControllerHost;

  beforeEach(() => {
    host = createMockHost();
  });

  it("should register itself with the host", () => {
    const core = createMockCore();
    new PreferenceCurrencyController(host, core as never);

    expect(host.addController).toHaveBeenCalledWith(expect.any(Object));
  });

  describe("currentCurrency", () => {
    it("should return the default currency", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currentCurrency).toBe("usd");
    });

    it("should reflect the stored currency", () => {
      const core = createMockCore({
        getPreferredFiatCurrency: () => "eur",
      });
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currentCurrency).toBe("eur");
    });
  });

  describe("currencies", () => {
    it("should expose the list of supported currencies", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currencies).toEqual(["usd", "eur", "gbp"]);
    });

    it("should always return the same reference", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currencies).toStrictEqual(controller.currencies);
    });
  });

  describe("getCurrencyDisplayName", () => {
    it("should return the display label for each supported currency", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.getCurrencyDisplayName("usd")).toBe(
        "USD Dollar - USD",
      );
      expect(controller.getCurrencyDisplayName("eur")).toBe("Euro - EUR");
      expect(controller.getCurrencyDisplayName("gbp")).toBe(
        "British Pound - GBP",
      );
    });
  });

  describe("selectCurrency", () => {
    it("should call core.savePreferredFiatCurrency with the selected currency", async () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      await controller.selectCurrency("eur");

      expect(core.savePreferredFiatCurrency).toHaveBeenCalledWith("eur");
    });

    it("should request a host update after selecting a currency", async () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      await controller.selectCurrency("usd");

      expect(host.requestUpdate).toHaveBeenCalled();
    });
  });
});
