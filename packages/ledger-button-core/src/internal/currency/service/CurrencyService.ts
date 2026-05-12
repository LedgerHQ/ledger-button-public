import type { FiatCurrency } from "../datasource/fiatCurrencyTypes.js";

export interface CurrencyService {
  initialize(): Promise<string>;
  getSupportedFiatCurrencies(): FiatCurrency[];
  savePreferredFiatCurrency(currency: string): Promise<void>;
}
