import {
  BlindSigningDisabledError,
  type BroadcastTracking,
  BroadcastTransactionError,
  DeviceOutOfMemoryError,
  IncorrectSeedError,
  isBroadcastedTransactionResult,
  type SignedResults,
  type SignNavigationIntent,
  type UserInteractionNeeded,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import { AnimationKey } from "../../components/index.js";
import { type CoreContext } from "../../context/core-context.js";
import { LanguageContext } from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { RootNavigationComponent } from "../../shared/root-navigation.js";
import { formatAddress } from "../../utils/format-address.js";
import { formatDeviceModelName } from "../../utils/format-device-name.js";

export type ScreenState =
  | {
      screen: "signing";
      deviceAnimation: Omit<
        AnimationKey,
        "pairing" | "pairingSuccess" | "frontView"
      >;
    }
  | { screen: "success"; status: StatusState; broadcast?: BroadcastTracking }
  | { screen: "error"; status: StatusState };

export type StatusState = {
  message: string;
  title: string;
  cta1: { label: string; action: () => void | Promise<void> };
  cta2?: { label: string; action: () => void | Promise<void> };
};

export class SignTransactionController implements ReactiveController {
  host: ReactiveControllerHost;
  private transactionSubscription?: Subscription;
  private broadcastSubscription?: Subscription;
  private currentIntent?: SignNavigationIntent;

  state: ScreenState = {
    screen: "signing",
    deviceAnimation: "signTransaction",
  };

  constructor(
    host: ReactiveControllerHost,
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
    this.clearBroadcastSubscription();
  }

  private clearBroadcastSubscription() {
    this.broadcastSubscription?.unsubscribe();
    this.broadcastSubscription = undefined;
  }

  private mapUserInteractionToDeviceAnimation(
    interaction: UserInteractionNeeded,
  ): Omit<AnimationKey, "pairing" | "pairingSuccess" | "frontView"> {
    switch (interaction) {
      case "unlock-device":
        return "pin";
      case "allow-secure-connection":
      case "confirm-open-app":
      case "allow-list-apps":
      case "web3-checks-opt-in":
        return "continueOnLedger";
      case "sign-transaction":
      default:
        return "signTransaction";
    }
  }

  startSigning(intent: SignNavigationIntent) {
    this.currentIntent = intent;

    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }
    this.clearBroadcastSubscription();

    this.transactionSubscription = intent.status$.subscribe({
      next: (result) => {
        switch (result.status) {
          case "success":
            if (result.data) {
              this.handleSignSuccess(result.data);
              break;
            }
            break;
          case "user-interaction-needed": {
            const animation = this.mapUserInteractionToDeviceAnimation(
              result.interaction,
            );
            this.state = { screen: "signing", deviceAnimation: animation };
            this.host.requestUpdate();
            break;
          }
          case "error":
            this.mapErrors(result.error);
            break;
        }

        this.host.requestUpdate();
      },
      error: (error: Error) => {
        this.mapErrors(error);
        this.host.requestUpdate();
      },
    });
  }

  private getDeviceName() {
    return formatDeviceModelName(
      this.lang.currentTranslation,
      this.core.getConnectedDevice()?.modelId,
    );
  }

  private mapSuccessToState(data: SignedResults): ScreenState {
    const lang = this.lang.currentTranslation;
    const copy =
      this.currentIntent?.params.type === "message"
        ? lang.signMessage?.success
        : lang.signTransaction?.success;

    return {
      screen: "success",
      status: {
        message: copy?.description,
        title: copy?.title,
        cta1: {
          label: lang.common.button.close,
          action: async () => {
            this.close();
          },
        },
      },
      broadcast: isBroadcastedTransactionResult(data)
        ? { hash: data.hash, state: "processing" }
        : undefined,
    };
  }

  /**
   * Core owns the `processing` -> `validated` transition and resolves the
   * explorer link while doing so, so the CTA is rebuilt on every emission
   * rather than derived up front.
   */
  private subscribeToBroadcastLifecycle(hash: string) {
    this.clearBroadcastSubscription();

    this.broadcastSubscription = this.core
      .observeBroadcastedTransaction(hash)
      .subscribe((broadcast) => {
        if (this.state.screen !== "success") {
          return;
        }
        this.state = {
          ...this.state,
          broadcast,
          status: {
            ...this.state.status,
            cta2: this.buildViewTransactionCta(broadcast),
          },
        };
        this.host.requestUpdate();
      });
  }

  private buildViewTransactionCta(broadcast: BroadcastTracking) {
    const explorerUrl = broadcast.explorerUrl;
    if (!explorerUrl) {
      return undefined;
    }
    return {
      label: this.lang.currentTranslation.signTransaction?.success
        ?.viewTransaction,
      action: () => this.viewTransactionDetails(explorerUrl, broadcast.hash),
    };
  }

  private mapErrors(error: unknown) {
    const lang = this.lang.currentTranslation;
    switch (true) {
      case error instanceof IncorrectSeedError: {
        const selectedAccount = this.core.getActiveSelectedAccount();
        const deviceName = this.getDeviceName();

        const accountName = selectedAccount
          ? (selectedAccount.name ?? formatAddress(selectedAccount.freshAddress))
          : "";

        const message = lang.error.device.IncorrectSeed.description
          .replace("{device}", deviceName)
          .replace("{account}", accountName);

        this.state = {
          screen: "error",
          status: {
            title: lang.error.device.IncorrectSeed.title,
            message,
            cta1: {
              label: lang.error.device.IncorrectSeed.cta1,
              action: async () => {
                await this.core.disconnectFromDevice();
                this.host.requestUpdate();
              },
            },
            cta2: {
              label: lang.error.device.IncorrectSeed.cta2,
              action: () => {
                this.currentIntent?.finish();
                this.close();
              },
            },
          },
        };
        break;
      }
      case error instanceof BlindSigningDisabledError: {
        this.state = {
          screen: "error",
          status: {
            title: lang.error.device.BlindSigningDisabled.title,
            message: lang.error.device.BlindSigningDisabled.description,
            cta1: {
              label: lang.error.device.BlindSigningDisabled.cta1,
              action: () => {
                this.state = {
                  screen: "signing",
                  deviceAnimation: "signTransaction",
                };
                this.currentIntent?.retry();
                this.host.requestUpdate();
              },
            },
            cta2: {
              label: lang.error.device.BlindSigningDisabled.cta2,
              action: () => {
                this.currentIntent?.finish();
                this.close();
              },
            },
          },
        };
        break;
      }
      case error instanceof BroadcastTransactionError: {
        this.state = {
          screen: "error",
          status: {
            title: lang.error.network.BroadcastTransactionError.title,
            message: lang.error.network.BroadcastTransactionError.description,
            cta1: {
              label: lang.error.network.BroadcastTransactionError.cta1,
              action: () => {
                this.state = {
                  screen: "signing",
                  deviceAnimation: "signTransaction",
                };
                this.currentIntent?.retry();
                this.host.requestUpdate();
              },
            },
          },
        };
        break;
      }
      case error instanceof UserRejectedTransactionError: {
        this.state = {
          screen: "error",
          status: {
            title: lang.error.device.ActionRejected.title,
            message: lang.error.device.ActionRejected.description,
            cta1: {
              label: lang.error.device.ActionRejected.cta1,
              action: () => {
                this.state = {
                  screen: "signing",
                  deviceAnimation: "continueOnLedger",
                };
                this.currentIntent?.retry();
                this.host.requestUpdate();
              },
            },
          },
        };
        break;
      }
      case error instanceof DeviceOutOfMemoryError: {
        const appName = error.context?.appName ?? "";
        const deviceName = this.getDeviceName();
        this.state = {
          screen: "error",
          status: {
            title: lang.error.device.DeviceOutOfStorage.title.replace(
              "{AppName}",
              appName,
            ),
            message: lang.error.device.DeviceOutOfStorage.description.replace(
              "{deviceName}",
              deviceName,
            ),
            cta1: {
              label: lang.error.device.DeviceOutOfStorage.cta1,
              action: () => {
                window.open("ledgerlive://myledger");
                this.close();
              },
            },
          },
        };
        break;
      }
      default: {
        this.state = {
          screen: "error",
          status: {
            title: lang.error.generic.sign.title,
            message: lang.error.generic.sign.description,
            cta1: {
              label: lang.error.generic.sign.cta1,
              action: () => {
                this.state = {
                  screen: "signing",
                  deviceAnimation: "signTransaction",
                };
                this.currentIntent?.retry();
                this.host.requestUpdate();
              },
            },
            cta2: {
              label: lang.error.generic.sign.cta2,
              action: () => {
                this.currentIntent?.finish();
                this.close();
              },
            },
          },
        };
        break;
      }
    }
  }

  private handleSignSuccess(data: SignedResults) {
    this.state = this.mapSuccessToState(data);
    if (this.state.screen === "success" && this.state.broadcast) {
      this.subscribeToBroadcastLifecycle(this.state.broadcast.hash);
    }
    this.host.requestUpdate();
  }

  viewTransactionDetails(url: string, transactionHash: string) {
    void this.core.trackViewTransactionDetailsClicked(transactionHash);
    window.open(url, "_blank", "noopener,noreferrer");
    this.close();
  }

  close = () => {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModal();
      this.host.requestUpdate();
    }
  };
}
