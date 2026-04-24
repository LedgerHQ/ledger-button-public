import { ReactiveController, ReactiveControllerHost } from "lit";

const CURRENCIES = ["usd", "eur", "gbp"] as const;

export type Currency = (typeof CURRENCIES)[number];

export class PreferenceCurrencyController {
  constructor(private readonly host: ReactiveControllerHost) {
    this.host.addController(this as ReactiveController);
  }

  get currencies(): readonly Currency[] {
    return CURRENCIES;
  }

  selectCurrency(currency: Currency) {
    console.log(currency);
  }
}
