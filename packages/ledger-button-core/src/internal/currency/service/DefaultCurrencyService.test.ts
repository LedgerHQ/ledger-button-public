import { Just, Left, Nothing, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StorageService } from "@internal/storage/StorageService";

import { DEFAULT_FIAT_CURRENCY, DEFAULT_SUPPORTED_FIAT_CURRENCIES } from "../constant";
import type { FiatCurrencyDataSource } from "../datasource/FiatCurrencyDataSource";
import type { FiatCurrency } from "../datasource/fiatCurrencyTypes";
import { DefaultCurrencyService } from "./DefaultCurrencyService";

const MOCK_CURRENCIES: FiatCurrency[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Pound Sterling" },
];

describe("DefaultCurrencyService", () => {
  let service: DefaultCurrencyService;
  let mockFiatCurrencyDataSource: FiatCurrencyDataSource;
  let mockStorageService: StorageService;

  beforeEach(() => {
    mockFiatCurrencyDataSource = {
      getSupportedFiatCurrencies: vi.fn().mockResolvedValue(Right(MOCK_CURRENCIES)),
    };

    mockStorageService = {
      getPreferredFiatCurrency: vi.fn(),
      savePreferredFiatCurrency: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageService;

    service = new DefaultCurrencyService(
      mockFiatCurrencyDataSource,
      mockStorageService,
    );
  });

  describe("getSupportedFiatCurrencies", () => {
    it("should return the default currencies before initialization", () => {
      expect(service.getSupportedFiatCurrencies()).toEqual(DEFAULT_SUPPORTED_FIAT_CURRENCIES);
    });

    it("should return the fetched currencies after initialization", async () => {
      vi.mocked(mockStorageService.getPreferredFiatCurrency).mockResolvedValue(Nothing);

      await service.initialize();

      expect(service.getSupportedFiatCurrencies()).toEqual(MOCK_CURRENCIES);
    });

    it("should fallback to default currencies when the data source fails", async () => {
      vi.mocked(
        mockFiatCurrencyDataSource.getSupportedFiatCurrencies,
      ).mockResolvedValue(Left(new Error("Request failed")));
      vi.mocked(mockStorageService.getPreferredFiatCurrency).mockResolvedValue(Nothing);

      await service.initialize();

      expect(service.getSupportedFiatCurrencies()).toEqual(DEFAULT_SUPPORTED_FIAT_CURRENCIES);
    });
  });

  describe("initialize", () => {
    it("should return the stored currency when valid", async () => {
      vi.mocked(mockStorageService.getPreferredFiatCurrency).mockResolvedValue(Just("EUR"));

      const result = await service.initialize();

      expect(result).toBe("EUR");
    });

    it("should return the default currency when nothing is stored", async () => {
      vi.mocked(mockStorageService.getPreferredFiatCurrency).mockResolvedValue(Nothing);

      const result = await service.initialize();

      expect(result).toBe(DEFAULT_FIAT_CURRENCY);
    });

    it("should fallback to the default currency when the stored code is not supported", async () => {
      vi.mocked(mockStorageService.getPreferredFiatCurrency).mockResolvedValue(Just("XYZ"));

      const result = await service.initialize();

      expect(result).toBe(DEFAULT_FIAT_CURRENCY);
    });
  });

  describe("savePreferredFiatCurrency", () => {
    it("should delegate to StorageService", async () => {
      await service.savePreferredFiatCurrency("GBP");

      expect(mockStorageService.savePreferredFiatCurrency).toHaveBeenCalledWith("GBP");
    });
  });
});
