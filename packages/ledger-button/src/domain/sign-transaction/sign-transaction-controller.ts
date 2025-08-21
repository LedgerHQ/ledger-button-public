import {
  SignTransactionParams,
  TransactionResult,
} from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";

interface SignTransactionHost extends ReactiveControllerHost {
  state: string;
  transactionId?: string;
}

export class SignTransactionController implements ReactiveController {
  host: SignTransactionHost;
  private transactionSubscription?: Subscription;

  constructor(
    host: SignTransactionHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
  ) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  hostDisconnected() {
    this.transactionSubscription?.unsubscribe();
  }

  startSigning(transactionParams: SignTransactionParams) {
    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }

    this.transactionSubscription = this.core
      .signTransaction(transactionParams)
      .subscribe({
        next: (result: TransactionResult) => {
          switch (result.status) {
            case "signing":
              this.host.state = "signing";
              break;
            case "signed":
              if (result.data) {
                this.host.state = "success";
                this.host.transactionId = result.data.hash;
              }
              break;
            case "error":
              this.host.state = "error";
              break;
          }
          this.host.requestUpdate();
        },
        error: () => {
          this.host.state = "error";
          this.host.requestUpdate();
        },
      });
  }

  viewTransactionDetails(transactionId: string) {
    console.log("Viewing transaction details for:", transactionId);
  }

  close() {
    this.navigation.navigateTo(this.destinations.home);
  }
}
