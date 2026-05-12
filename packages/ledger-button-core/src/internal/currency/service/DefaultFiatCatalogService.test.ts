import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SUPPORTED_FIAT_CURRENCIES } from "../../account/model/constant.js";
import type { FiatCurrencyDataSource } from "../datasource/FiatCurrencyDataSource.js";
import type { FiatCurrency } from "../datasource/fiatCurrencyTypes.js";
import { DefaultFiatCatalogService } from "./DefaultFiatCatalogService.js";

describe("DefaultFiatCatalogService", () => {
  let service: DefaultFiatCatalogService;
  let mockFiatCurrencyDataSource: FiatCurrencyDataSource;

  beforeEach(() => {
    mockFiatCurrencyDataSource = {
      getSupportedFiatCurrencies: vi.fn(),
    };

    service = new DefaultFiatCatalogService(mockFiatCurrencyDataSource);
  });

  it("should initialize with default supported fiat currencies", () => {
    expect(service.getSupportedFiatCurrencies()).toEqual(
      DEFAULT_SUPPORTED_FIAT_CURRENCIES,
    );
  });

  it("should update currencies when initialization succeeds", async () => {
    const supportedFiatCurrencies: FiatCurrency[] = [
      { code: "USD", name: "US Dollar" },
      { code: "EUR", name: "Euro" },
      { code: "GBP", name: "Pound Sterling" },
      { code: "JPY", name: "Yen" },
    ];
    vi.mocked(
      mockFiatCurrencyDataSource.getSupportedFiatCurrencies,
    ).mockResolvedValue(Right(supportedFiatCurrencies));

    await service.initializeSupportedFiatCurrencies();

    expect(service.getSupportedFiatCurrencies()).toEqual(supportedFiatCurrencies);
  });

  it("should fallback to default currencies when initialization fails", async () => {
    vi.mocked(
      mockFiatCurrencyDataSource.getSupportedFiatCurrencies,
    ).mockResolvedValue(Left(new Error("Request failed")));

    await service.initializeSupportedFiatCurrencies();

    expect(service.getSupportedFiatCurrencies()).toEqual(
      DEFAULT_SUPPORTED_FIAT_CURRENCIES,
    );
  });
});
