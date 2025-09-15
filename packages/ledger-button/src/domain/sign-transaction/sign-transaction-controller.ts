import {
  type SignedResults,
  SignFlowStatus,
  type SignPersonalMessageParams,
  type SignRawTransactionParams,
  type SignTransactionParams,
  type SignTypedMessageParams,
  type UserInteractionNeeded,
} from "@ledgerhq/ledger-button-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { AnimationKey } from "../../components/index.js";
import { type CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { RootNavigationComponent } from "../../shared/root-navigation.js";

interface SignTransactionHost extends ReactiveControllerHost {
  transactionId?: string;
}

export type SignTransactionState = "signing" | "success" | "error";

export class SignTransactionController implements ReactiveController {
  host: SignTransactionHost;
  private transactionSubscription?: Subscription;
  result?: SignedResults;

  state: { screen: SignTransactionState; deviceAnimation: AnimationKey } = {
    screen: "signing",
    deviceAnimation: "signTransaction",
  };

  constructor(
    host: SignTransactionHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
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

  private mapUserInteractionToDeviceAnimation(
    interaction: UserInteractionNeeded,
  ): AnimationKey {
    switch (interaction) {
      case "unlock-device":
        return "pin";
      case "allow-secure-connection":
      case "confirm-open-app":
      case "sign-transaction":
      case "allow-list-apps":
      case "web3-checks-opt-in":
        return "continueOnLedger";
      default:
        return "signTransaction";
    }
  }

  startSigning(
    transactionParams:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedMessageParams
      | SignPersonalMessageParams,
    broadcast: boolean,
  ) {
    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }

    this.transactionSubscription = this.core
      .sign(transactionParams, broadcast)
      .subscribe({
        next: (result: SignFlowStatus) => {
          console.log("Signed transaction result", result);
          switch (result.status) {
            case "success":
              if (result.data) {
                this.state.screen = "success";
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
              this.state.screen = "signing";
              this.state.deviceAnimation =
                this.mapUserInteractionToDeviceAnimation(result.interaction);
              break;
            case "error":
              console.log("Error signing transaction", result.error);
              this.state.screen = "error";
              break;
          }
          this.host.requestUpdate();
        },
        error: (error: Error) => {
          console.log("Error signing transaction", error);
          this.state.screen = "error";
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
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
      this.host.requestUpdate();
    }
  }
}
