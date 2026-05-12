import { inject, injectable } from "inversify";

import { DEFAULT_SUPPORTED_FIAT_CURRENCIES } from "../../account/model/constant.js";
import { currencyModuleTypes } from "../currencyModuleTypes.js";
import type { FiatCurrencyDataSource } from "../datasource/FiatCurrencyDataSource.js";
import type { FiatCurrency } from "../datasource/fiatCurrencyTypes.js";
import type { FiatCatalogService } from "./FiatCatalogService.js";

@injectable()
export class DefaultFiatCatalogService implements FiatCatalogService {
  private supportedFiatCurrencies: FiatCurrency[] = DEFAULT_SUPPORTED_FIAT_CURRENCIES;

  constructor(
    @inject(currencyModuleTypes.FiatCurrencyDataSource)
    private readonly fiatCurrencyDataSource: FiatCurrencyDataSource,
  ) {}

  async initializeSupportedFiatCurrencies(): Promise<void> {
    const result =
      await this.fiatCurrencyDataSource.getSupportedFiatCurrencies();
    this.supportedFiatCurrencies = result.orDefault(DEFAULT_SUPPORTED_FIAT_CURRENCIES);
  }

  getSupportedFiatCurrencies(): FiatCurrency[] {
    return this.supportedFiatCurrencies;
  }
}
