import type { FiatCurrency } from "../datasource/fiatCurrencyTypes.js";

export interface FiatCatalogService {
  initializeSupportedFiatCurrencies(): Promise<void>;
  getSupportedFiatCurrencies(): FiatCurrency[];
}
