import {
  LedgerButtonCore,
  SignTransactionParams,
} from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";

interface SignTransactionHost extends ReactiveControllerHost {
  state: string;
  transactionId: string;
}

export class SignTransactionController implements ReactiveController {
  host: SignTransactionHost;

  constructor(
    host: SignTransactionHost,
    private readonly core: LedgerButtonCore,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  async startSigning(transactionParams: SignTransactionParams) {
    try {
      const result = await this.core.signTransaction(transactionParams);

      this.host.state = "success";
      this.host.transactionId = result.hash;
      this.host.requestUpdate();
    } catch (error) {
      this.host.state = "error";
      this.host.requestUpdate();
    }
  }

  viewTransactionDetails(transactionId: string) {
    console.log("Viewing transaction details for:", transactionId);
  }

  close() {
    this.navigation.navigateTo(this.destinations.home);
  }
}
