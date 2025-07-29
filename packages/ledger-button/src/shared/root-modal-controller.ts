import {
  LedgerButtonCore,
  SignTransactionParams,
} from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Translation } from "../context/language-context.js";
import { Navigation } from "./navigation.js";
import { Destinations, makeDestinations } from "./routes.js";

export class RootModalController implements ReactiveController {
  host: ReactiveControllerHost;
  core: LedgerButtonCore;
  navigation: Navigation;
  selectedAccount: unknown /* | null */;
  deviceSessionId: string | null = null;
  isModalOpen = false;
  destinations: Destinations;
  pendingTransactionParams?: SignTransactionParams;

  constructor(
    host: ReactiveControllerHost,
    core: LedgerButtonCore,
    translation: Translation,
  ) {
    this.host = host;
    this.host.addController(this);
    this.core = core;
    this.navigation = new Navigation(host);
    this.destinations = makeDestinations(translation);
    this.pendingTransactionParams = (core as any)._pendingTransactionParams;
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  get currentScreen() {
    return this.navigation.currentScreen;
  }

  async computeInitialState() {
    this.navigation.navigateTo(this.destinations.onboarding);
    // const accounts = await this.core.fetchAccounts();
    // if (accounts?.length === 0) {
    //   this.navigation.navigateTo(destinations.onboarding);
    // } else {
    //   this.navigation.navigateTo(destinations.home);
    // }
  }

  checkForPendingTransaction() {
    if (this.pendingTransactionParams) {
      this.navigation.navigateTo(this.destinations.signTransaction);
    }
  }

  async openModal() {
    if (!this.currentScreen) {
      await this.computeInitialState();
    }
    this.isModalOpen = true;
    // const accounts = await this.core.fetchAccounts();
    // if (accounts?.length === 0) {
    //   this.navigation.navigateTo(destinations.onboarding);
    // } else {
    //   this.navigation.navigateTo(destinations.home);
    // }
    this.host.requestUpdate();
  }

  async closeModal() {
    this.isModalOpen = false;
    this.host.requestUpdate();
  }
}
