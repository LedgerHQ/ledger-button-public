import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";

// CURRENCIES must be a subset of SUPPORTED_FIAT_CURRENCIES in ledger-button-core.
// Adding a currency here without adding it to core will cause a mismatch!
const CURRENCIES = ["usd", "eur", "gbp"];

export type Currency = (typeof CURRENCIES)[number];

export class PreferenceCurrencyController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this as ReactiveController);
  }

  get currentCurrency(): string {
    return this.core.getPreferredFiatCurrency().toUpperCase();
  }

  get currencies(): readonly Currency[] {
    return CURRENCIES.map((c) => c.toUpperCase());
  }

  async selectCurrency(currency: Currency): Promise<void> {
    await this.core.savePreferredFiatCurrency(currency);
    this.host.requestUpdate();
  }
}
