import "../../../shared/root-navigation.js";

import { Account } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { CoreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";

export class SelectAccountController implements ReactiveController {
  accounts: Account[] = [];
  errorData?: {
    message: string;
    title: string;
    cta1?: { label: string; action: () => void };
    cta2?: { label: string; action: () => void };
  } = undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.getAccounts();
  }

  async getAccounts() {
    const accounts = await this.core.getAccounts();
    this.accounts = accounts ?? [];
    this.host.requestUpdate();
  }

  selectAccount(address: string) {
    if (this.navigation.host instanceof RootNavigationComponent) {
      //this.core.selectAccount(address);
      this.navigation.host.selectAccount(address);
      this.host.requestUpdate();
    }
  }
}
