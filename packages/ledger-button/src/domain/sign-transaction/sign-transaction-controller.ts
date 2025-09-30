import {
  BlindSigningDisabledError,
  BroadcastTransactionError,
  IncorrectSeedError,
  isBroadcastedTransactionResult,
  isSignedMessageOrTypedDataResult,
  isSignedTransactionResult,
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
import { LanguageContext } from "src/context/language-context.js";

import { AnimationKey } from "../../components/index.js";
import { type CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { RootNavigationComponent } from "../../shared/root-navigation.js";

interface SignTransactionHost extends ReactiveControllerHost {
  transactionId: string;
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

  errorData?: {
    message: string;
    title: string;
    cta1?: { label: string; action: () => void | Promise<void> };
    cta2?: { label: string; action: () => void | Promise<void> };
  } = undefined;

  constructor(
    host: SignTransactionHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly lang: LanguageContext,
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
          switch (result.status) {
            case "success":
              if (result.data) {
                if (
                  isSignedTransactionResult(result.data) ||
                  isSignedMessageOrTypedDataResult(result.data) ||
                  isBroadcastedTransactionResult(result.data)
                ) {
                  this.state.screen = "success";
                  if (isBroadcastedTransactionResult(result.data)) {
                    this.host.transactionId = result.data.hash;
                  }
                  this.result = result.data;
                  break;
                }
              }
              break;
            case "user-interaction-needed":
              //TODO handle mapping for user interaction needed + update DeviceAnimation component regarding these interactions
              //Interactions: unlock-device, allow-secure-connection, confirm-open-app, sign-transaction, allow-list-apps, web3-checks-opt-in
              this.state.screen = "signing";
              this.state.deviceAnimation =
                this.mapUserInteractionToDeviceAnimation(result.interaction);
              break;
            case "error":
              this.state.screen = "error";
              this.mapErrors(result.error);
              break;
          }
          this.host.requestUpdate();
        },
        error: (error: Error) => {
          this.state.screen = "error";
          this.mapErrors(error);
          this.host.requestUpdate();
        },
      });
  }

  private getDeviceName() {
    const device = this.core.getConnectedDevice();
    return device?.name || device?.modelId
      ? this.lang.currentTranslation.common.device.model[device.modelId]
      : this.lang.currentTranslation.common.device.model.fallback;
  }

  private mapErrors(error: unknown) {
    const lang = this.lang.currentTranslation;
    switch (true) {
      case error instanceof IncorrectSeedError: {
        const selectedAccount = this.core.getSelectedAccount();
        const deviceName = this.getDeviceName();

        let accountName = "";
        if (selectedAccount) {
          if (selectedAccount.name) {
            accountName = selectedAccount.name;
          } else {
            accountName =
              selectedAccount.freshAddress.slice(0, 6) +
              "..." +
              selectedAccount.freshAddress.slice(-4);
          }
        }

        const message = lang.error.device.IncorrectSeed.description
          .replace("{device}", deviceName)
          .replace("{account}", accountName || "");

        this.errorData = {
          title: lang.error.device.IncorrectSeed.title,
          message,
          cta1: {
            label: lang.error.device.IncorrectSeed.cta1,
            action: async () => {
              this.errorData = undefined;
              await this.core.disconnectFromDevice();
              this.host.requestUpdate();
            },
          },
        };
        break;
      }
      case error instanceof BlindSigningDisabledError: {
        this.errorData = {
          title: lang.error.device.BlindSigningDisabled.title,
          message: lang.error.device.BlindSigningDisabled.description,
          cta1: {
            label: lang.error.device.BlindSigningDisabled.cta1,
            action: async () => {
              this.errorData = undefined;
              await this.core.disconnectFromDevice();
              this.host.requestUpdate();
            },
          },
        };
        break;
      }
      case error instanceof BroadcastTransactionError: {
        this.errorData = {
          title: lang.error.network.BroadcastTransactionError.title,
          message: lang.error.network.BroadcastTransactionError.description,
          cta1: {
            label: lang.error.network.BroadcastTransactionError.cta1,
            action: async () => {
              this.errorData = undefined;
              await this.core.disconnectFromDevice();
              this.host.requestUpdate();
            },
          },
          cta2: {
            label: lang.error.network.BroadcastTransactionError.cta2,
            action: async () => {
              this.viewTransactionDetails(this.host.transactionId);
            },
          },
        };
        break;
      }
      default: {
        this.errorData = {
          title: lang.error.generic.sign.title,
          message: lang.error.generic.sign.description,
          cta1: {
            label: lang.error.generic.sign.cta1,
            action: async () => {
              this.errorData = undefined;
              await this.core.disconnectFromDevice();
              this.host.requestUpdate();
            },
          },
        };
        break;
      }
    }
  }

  viewTransactionDetails(transactionId: string) {
    window.open(`https://etherscan.io/tx/${transactionId}`);
    this.close();
  }

  close() {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
      this.host.requestUpdate();
    }
  }
}
