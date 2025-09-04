import {
  type Signature,
  type SignedTransaction,
  SignedTransactionResult,
  type SignRawTransactionParams,
  type SignTransactionParams,
  type SignTypedMessageParams,
} from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { type CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { RootNavigationComponent } from "../../shared/root-navigation.js";
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
      | SignTypedMessageParams,
    broadcast: boolean,
  ) {
    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }

    this.transactionSubscription = this.core
      .sign(transactionParams, broadcast)
      .subscribe({
        next: (result: SignedTransactionResult) => {
          console.log("Signed transaction result", result);
          switch (result.status) {
            case "success":
              if (result.data) {
                this.host.state = "success";
                if ("hash" in result.data) {
                  this.host.transactionId = result.data.hash;
                }
                this.result = result.data;
              }
              this.result = result.data;
              break;
            case "user-interaction-needed":
              //TODO handle mapping for user interaction needed + update DeviceAnimation component regarding these interactions
              //Interactions: unlock-device, allow-secure-connection, confirm-open-app, sign-transaction, allow-list-apps, web3-checks-opt-in
              this.host.state = result.interaction;
              break;
            case "error":
              console.log("Error signing transaction", result.error);
              this.host.state = "error";
              break;
          }
          this.host.requestUpdate();
        },
        error: (error: Error) => {
          console.log("Error signing transaction", error);
          this.host.state = "error";
          this.host.requestUpdate();
        },
      });
  }
  //TODO do not display this button for EIP712 messages
  viewTransactionDetails(transactionId: string) {
    window.open(`https://etherscan.io/tx/${transactionId}`);
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
    }
  }

  close() {
    this.navigation.navigateTo(this.destinations.home);
  }
}
