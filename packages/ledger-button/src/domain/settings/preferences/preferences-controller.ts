import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context";

export class PreferencesController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this as ReactiveController);
  }

  get currency(): string {
    return this.core.getPreferredFiatCurrency().toUpperCase();
  }
}
