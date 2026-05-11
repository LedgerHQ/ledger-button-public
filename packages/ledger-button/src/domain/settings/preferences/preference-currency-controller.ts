import type { FiatCurrency } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";

export class PreferenceCurrencyController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this as ReactiveController);
  }

  private trackCurrencyChanged(currencyCode: Currency): void {
    void this.core.trackCurrencyChanged(currencyCode);
  }

  async selectCurrency(currency: Currency): Promise<void> {
    if (currency === this.core.getPreferredFiatCurrency()) {
      return;
    }

    await this.core.savePreferredFiatCurrency(currency);
    this.trackCurrencyChanged(currency);
    this.host.requestUpdate();
  }

  get currentCurrency() {
    return this.core.getPreferredFiatCurrency();
  }

  get currencies(): FiatCurrency[] {
    return this.core.getSupportedFiatCurrencies();
  }

  getCurrencyDisplayName(currency: Currency): string {
    return FIAT_CURRENCY_DISPLAY_NAMES[currency];
  }
}
