import { inject, injectable } from "inversify";

import { storageModuleTypes } from "@internal/storage/di/storageModuleTypes.js";
import type { StorageService } from "@internal/storage/StorageService.js";

import { DEFAULT_FIAT_CURRENCY, DEFAULT_SUPPORTED_FIAT_CURRENCIES } from "../constant.js";
import type { FiatCurrencyDataSource } from "../datasource/FiatCurrencyDataSource.js";
import type { FiatCurrency } from "../datasource/fiatCurrencyTypes.js";
import { currencyModuleTypes } from "../di/currencyModuleTypes.js";
import type { CurrencyService } from "./CurrencyService.js";

@injectable()
export class DefaultCurrencyService implements CurrencyService {
  private supportedFiatCurrencies: FiatCurrency[] = DEFAULT_SUPPORTED_FIAT_CURRENCIES;

  constructor(
    @inject(currencyModuleTypes.FiatCurrencyDataSource)
    private readonly fiatCurrencyDataSource: FiatCurrencyDataSource,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
  ) {}

  async initialize(): Promise<string> {
    const result = await this.fiatCurrencyDataSource.getSupportedFiatCurrencies();
    this.supportedFiatCurrencies = result.orDefault(DEFAULT_SUPPORTED_FIAT_CURRENCIES);

    const storedCurrency = await this.storageService.getPreferredFiatCurrency();

    return storedCurrency
      .filter((code) => this.supportedFiatCurrencies.some((c) => c.code === code))
      .orDefault(DEFAULT_FIAT_CURRENCY);
  }

  getSupportedFiatCurrencies(): FiatCurrency[] {
    return this.supportedFiatCurrencies;
  }

  async savePreferredFiatCurrency(currency: string): Promise<void> {
    await this.storageService.savePreferredFiatCurrency(currency);
  }
}
