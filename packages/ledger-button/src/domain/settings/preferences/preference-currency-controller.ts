import { ReactiveController, ReactiveControllerHost } from "lit";

import { DEFAULT_CURRENCY } from "../../../context/constants/currency.js";
import { type CoreContext } from "../../../context/core-context.js";

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

export type Currency = (typeof CURRENCIES)[number];

export class PreferenceCurrencyController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this as ReactiveController);
  }

  get currentCurrency(): Currency {
    const preferredCurrency = this.core.getPreferredFiatCurrency();
    const currency = CURRENCIES.find(
      (c) => c === preferredCurrency?.toUpperCase(),
    );
    return currency ?? (DEFAULT_CURRENCY as Currency);
  }

  get currencies(): readonly Currency[] {
    return CURRENCIES;
  }

  async selectCurrency(currency: Currency): Promise<void> {
    await this.core.savePreferredFiatCurrency(currency);
    this.host.requestUpdate();
  }
}
