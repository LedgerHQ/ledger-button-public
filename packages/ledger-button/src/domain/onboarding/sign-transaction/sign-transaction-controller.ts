import {
  LedgerButtonCore,
  TransactionData,
} from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { Navigation } from "../../../shared/navigation.js";
import { destinations } from "../../../shared/routes.js";

export class SignTransactionController implements ReactiveController {
  host: ReactiveControllerHost;

  constructor(
    host: ReactiveControllerHost,
    private readonly core: LedgerButtonCore,
    private readonly navigation: Navigation,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  async startSigning(transactionData: TransactionData) {
    try {
      const result = await this.core.signTransaction(transactionData);

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
    this.navigation.navigateTo(destinations.home);
  }
}
