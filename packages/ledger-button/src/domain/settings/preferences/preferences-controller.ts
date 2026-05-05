import { ReactiveController, ReactiveControllerHost } from "lit";

import { DEFAULT_CURRENCY } from "../../../context/constants/currency.js";
import { type CoreContext } from "../../../context/core-context.js";

export class PreferencesController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this as ReactiveController);
  }

  get currency(): string {
    return (
      this.core.getPreferredFiatCurrency() ?? DEFAULT_CURRENCY
    ).toUpperCase();
  }
}
