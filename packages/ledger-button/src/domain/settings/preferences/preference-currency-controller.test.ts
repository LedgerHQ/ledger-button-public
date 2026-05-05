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
  overrides: Partial<{ getPreferredFiatCurrency: () => string | undefined }> = {},
) {
  return {
    getPreferredFiatCurrency: vi.fn().mockReturnValue(undefined),
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
    it("should default when preference is unset", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currentCurrency).toBe("USD");
    });

    it("should normalize stored value to uppercase", () => {
      const core = createMockCore({
        getPreferredFiatCurrency: () => "eur",
      });
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currentCurrency).toBe("EUR");
    });

    it("should fall back to default when stored value is unknown", () => {
      const core = createMockCore({
        getPreferredFiatCurrency: () => "xyz",
      });
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currentCurrency).toBe("USD");
    });
  });

  describe("currencies", () => {
    it("should expose the list of supported currencies", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currencies).toEqual(["USD", "EUR", "GBP"]);
    });

    it("should always return the same reference", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currencies).toBe(controller.currencies);
    });
  });

  describe("selectCurrency", () => {
    it("should call core.savePreferredFiatCurrency with the selected currency", async () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      await controller.selectCurrency("EUR");

      expect(core.savePreferredFiatCurrency).toHaveBeenCalledWith("EUR");
    });

    it("should request a host update after selecting a currency", async () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      await controller.selectCurrency("USD");

      expect(host.requestUpdate).toHaveBeenCalled();
    });
  });
});
