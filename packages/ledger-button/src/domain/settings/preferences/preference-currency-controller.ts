import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";

const CURRENCIES = ["usd", "eur", "gbp"] as const;

export type Currency = (typeof CURRENCIES)[number];

export class PreferenceCurrencyController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this as ReactiveController);
  }

  get currencies(): readonly Currency[] {
    return CURRENCIES;
  }

  async selectCurrency(currency: Currency): Promise<void> {
    await this.core.savePreferredFiatCurrency(currency);
    this.host.requestUpdate();
  }
}
