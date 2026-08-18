import type { FiatCurrency } from "../datasource/fiatCurrencyTypes";

export interface CurrencyService {
  initialize(): Promise<string>;
  getSupportedFiatCurrencies(): FiatCurrency[];
  savePreferredFiatCurrency(currency: string): Promise<void>;
}
