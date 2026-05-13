import type { FiatCurrency } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PreferenceCurrencyController } from "./preference-currency-controller.js";

const MOCK_CURRENCIES: FiatCurrency[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Pound Sterling" },
];

function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

function createMockCore(
  overrides: Partial<{
    getPreferredFiatCurrency: () => string;
    getSupportedFiatCurrencies: () => FiatCurrency[];
  }> = {},
) {
  return {
    getPreferredFiatCurrency: vi.fn().mockReturnValue("USD"),
    getSupportedFiatCurrencies: vi.fn().mockReturnValue(MOCK_CURRENCIES),
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

      expect(controller.currentCurrency).toBe("USD");
    });

    it("should reflect the stored currency", () => {
      const core = createMockCore({
        getPreferredFiatCurrency: () => "EUR",
      });
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currentCurrency).toBe("EUR");
    });
  });

  describe("currencies", () => {
    it("should expose the list of supported currencies from core", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currencies).toEqual(MOCK_CURRENCIES);
    });

    it("should always return the same reference", () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      expect(controller.currencies).toStrictEqual(controller.currencies);
    });
  });

  describe("selectCurrency", () => {
    it("should call core.savePreferredFiatCurrency with the currency code", async () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      await controller.selectCurrency({ code: "EUR", name: "Euro" });

      expect(core.savePreferredFiatCurrency).toHaveBeenCalledWith("EUR");
    });

    it("should request a host update after selecting a currency", async () => {
      const core = createMockCore();
      const controller = new PreferenceCurrencyController(host, core as never);

      await controller.selectCurrency({ code: "USD", name: "US Dollar" });

      expect(host.requestUpdate).toHaveBeenCalled();
    });
  });
});
