import {
  type Signature,
  type SignedTransaction,
  type SignRawTransactionParams,
  type SignTransactionParams,
  type SignTypedDataParams,
  type TransactionResult,
} from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { type CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { type Destinations } from "../../shared/routes.js";

interface SignTransactionHost extends ReactiveControllerHost {
  state: string;
  transactionId?: string;
}

export class SignTransactionController implements ReactiveController {
  host: SignTransactionHost;
  private transactionSubscription?: Subscription;
  result?: SignedTransaction | Signature;

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

  startSigning(
    transactionParams:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedDataParams,
  ) {
    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }

    this.transactionSubscription = this.core.sign(transactionParams).subscribe({
      next: (result: TransactionResult) => {
        switch (result.status) {
          case "signing":
            this.host.state = "signing";
            break;
          case "signed":
            if (result.data) {
              this.host.state = "success";
              if ("hash" in result.data) {
                this.host.transactionId = result.data.hash;
              }
              this.result = result.data;
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
