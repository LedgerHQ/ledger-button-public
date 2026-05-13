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

  get currentCurrency(): string {
    return this.core.getPreferredFiatCurrency();
  }

  get currencies(): FiatCurrency[] {
    return this.core.getSupportedFiatCurrencies();
  }

  async selectCurrency(currency: FiatCurrency): Promise<void> {
    await this.core.savePreferredFiatCurrency(currency.code);
    this.host.requestUpdate();
  }
}
