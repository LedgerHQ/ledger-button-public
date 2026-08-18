import type { FiatCurrency } from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context";
import { Navigation } from "../../../shared/navigation";

export class PreferenceCurrencyController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this as ReactiveController);
  }

  private trackCurrencyChanged(currencyCode: FiatCurrency["code"]): void {
    void this.core.trackCurrencyChanged(currencyCode);
  }

  async selectCurrency(currencyCode: FiatCurrency["code"]): Promise<void> {
    if (currencyCode === this.core.getPreferredFiatCurrency()) {
      return;
    }

    await this.core.savePreferredFiatCurrency(currencyCode);
    this.trackCurrencyChanged(currencyCode);
    this.navigation.navigateBack();
  }
  get currentCurrency() {
    return this.core.getPreferredFiatCurrency();
  }

  get currencies(): FiatCurrency[] {
    return this.core.getSupportedFiatCurrencies();
  }
}
