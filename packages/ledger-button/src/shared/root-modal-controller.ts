import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "./navigation.js";
import { destinations } from "./routes.js";

export class RootModalController implements ReactiveController {
  host: ReactiveControllerHost;
  core: LedgerButtonCore;
  navigation: Navigation;

  selectedAccount: unknown /* | null */;
  deviceSessionId: string | null = null;

  constructor(host: ReactiveControllerHost, core: LedgerButtonCore) {
    this.host = host;
    this.host.addController(this);
    this.core = core;
    this.navigation = new Navigation(host);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  get currentScreen() {
    return this.navigation.currentScreen;
  }

  async computeInitialState() {
    this.navigation.navigateTo(destinations.onboarding);
    // const accounts = await this.core.fetchAccounts();
    // if (accounts?.length === 0) {
    //   this.navigation.navigateTo(destinations.onboarding);
    // } else {
    //   this.navigation.navigateTo(destinations.home);
    // }
  }

  async openModal() {
    const accounts = await this.core.fetchAccounts();
    if (accounts?.length === 0) {
      this.navigation.navigateTo(destinations.onboarding);
    } else {
      this.navigation.navigateTo(destinations.home);
    }
  }
}
