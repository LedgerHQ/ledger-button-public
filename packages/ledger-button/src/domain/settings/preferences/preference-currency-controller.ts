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

  private trackCurrencyChanged(currencyCode: FiatCurrency["code"]): void {
    void this.core.trackCurrencyChanged(currencyCode);
  }

  async selectCurrency(currency: FiatCurrency): Promise<void> {
    if (currency.code === this.core.getPreferredFiatCurrency()) {
      return;
    }

    await this.core.savePreferredFiatCurrency(currency.code);
    this.trackCurrencyChanged(currency.code);
    this.host.requestUpdate();
  }
  get currentCurrency() {
    return this.core.getPreferredFiatCurrency();
  }

  get currencies(): FiatCurrency[] {
    return this.core.getSupportedFiatCurrencies();
  }
}
