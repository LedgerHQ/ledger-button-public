import {
  BlindSigningDisabledError,
  BroadcastTransactionError,
  buildExplorerTransactionUrl,
  DeviceOutOfStorageError,
  IncorrectSeedError,
  isBroadcastedTransactionResult,
  isSignedMessageOrTypedDataResult,
  isSignedTransactionResult,
  isSignPersonalMessageParams,
  isSignRawTransactionParams,
  isSignTransactionParams,
  type SignedResults,
  type SignFlowStatus,
  type SignPersonalMessageParams,
  type SignRawTransactionParams,
  type SignTransactionParams,
  type SignTypedMessageParams,
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

export type BroadcastState = "processing" | "validated";

export type BroadcastInfo = {
  state: BroadcastState;
  hash: string;
};

export type ScreenState =
  | {
      screen: "signing";
      deviceAnimation: Omit<
        AnimationKey,
        "pairing" | "pairingSuccess" | "frontView"
      >;
    }
  | { screen: "success"; status: StatusState; broadcast?: BroadcastInfo }
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
  private pendingTxSubscription?: Subscription;
  private currentTransaction?:
    | SignTransactionParams
    | SignRawTransactionParams
    | SignTypedMessageParams
    | SignPersonalMessageParams;
  private explorerTemplatePrefetch?: Promise<string | undefined>;
  result?: SignedResults;

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
    this.clearPendingTxSubscription();
  }

  private clearPendingTxSubscription() {
    this.pendingTxSubscription?.unsubscribe();
    this.pendingTxSubscription = undefined;
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

  startSigning(
    transactionParams:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedMessageParams
      | SignPersonalMessageParams,
  ) {
    this.currentTransaction = transactionParams;
    this.explorerTemplatePrefetch = this.isTransactionParameter(
      transactionParams,
    )
      ? this.prefetchTransactionExplorerUrlTemplate()
      : undefined;

    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }
    this.clearPendingTxSubscription();

    this.transactionSubscription = this.core.sign(transactionParams).subscribe({
      next: (result: SignFlowStatus) => {
        switch (result.status) {
          case "success":
            if (result.data) {
              if (
                isSignedTransactionResult(result.data) ||
                isSignedMessageOrTypedDataResult(result.data)
              ) {
                window.dispatchEvent(
                  new CustomEvent<{ status: "success"; data: SignedResults }>(
                    "ledger-internal-sign",
                    {
                      bubbles: true,
                      composed: true,
                      detail: { status: "success", data: result.data },
                    },
                  ),
                );
              }

              void this.handleSignSuccess(result.data);
              break;
            }
            break;
          case "user-interaction-needed": {
            //TODO handle mapping for user interaction needed + update DeviceAnimation component regarding these interactions
            //Interactions: unlock-device, allow-secure-connection, confirm-open-app, sign-transaction, allow-list-apps, web3-checks-opt-in
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
    const device = this.core.getConnectedDevice();
    return device?.name || device?.modelId
      ? this.lang.currentTranslation.common.device.model[device.modelId]
      : this.lang.currentTranslation.common.device.model.fallback;
  }

  private isTransactionParameter(
    transactionParams:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedMessageParams
      | SignPersonalMessageParams
      | undefined,
  ): boolean {
    if (!transactionParams) {
      return false;
    }

    if (isSignPersonalMessageParams(transactionParams)) {
      return false;
    }

    return (
      isSignTransactionParams(transactionParams) ||
      isSignRawTransactionParams(transactionParams)
    );
  }

  private mapSuccessToState(
    data: SignedResults,
    transactionExplorerUrlTemplate?: string,
  ): ScreenState {
    const lang = this.lang.currentTranslation;

    let cta2 = undefined;
    let broadcast: BroadcastInfo | undefined = undefined;
    if (isBroadcastedTransactionResult(data)) {
      broadcast = { state: "processing", hash: data.hash };
      const explorerUrl = buildExplorerTransactionUrl(
        transactionExplorerUrlTemplate,
        data.hash,
      );
      if (explorerUrl) {
        cta2 = {
          label: lang.signTransaction?.success?.viewTransaction,
          action: () => this.viewTransactionDetails(explorerUrl, data.hash),
        };
      }
    }

    if (isSignedMessageOrTypedDataResult(data)) {
      return {
        screen: "success",
        status: {
          message: lang.signMessage?.success?.description,
          title: lang.signMessage?.success?.title,
          cta1: {
            label: lang.common.button.close,
            action: async () => {
              this.close();
            },
          },
          cta2,
        },
      };
    }
    return {
      screen: "success",
      status: {
        message: lang.signTransaction?.success?.description,
        title: lang.signTransaction?.success?.title,
        cta1: {
          label: lang.common.button.close,
          action: async () => {
            this.close();
          },
        },
        cta2,
      },
      broadcast,
    };
  }

  private subscribeToBroadcastLifecycle(hash: string) {
    this.clearPendingTxSubscription();

    // Wait until the hash has appeared in the pending pool at least once
    // before allowing the `validated` flip. The pool is populated only after
    // TrackBroadcastedTransactionUseCase has finished its CAL enrichment, so
    // the BehaviorSubject's initial replay can legitimately not contain the
    // hash for a few hundred ms after `processing` is set. The subscription
    // is kept alive until hostDisconnected() or the next startSigning().
    let hasBeenSeenInPool = false;

    this.pendingTxSubscription = this.core
      .observePendingTransactions()
      .subscribe((txs) => {
        if (this.state.screen !== "success" || !this.state.broadcast) {
          return;
        }
        const stillPending = txs.some((tx) => tx.hash === hash);
        if (stillPending) {
          hasBeenSeenInPool = true;
        }
        const nextBroadcastState: BroadcastState =
          !hasBeenSeenInPool || stillPending ? "processing" : "validated";
        if (nextBroadcastState !== this.state.broadcast.state) {
          this.state = {
            ...this.state,
            broadcast: { ...this.state.broadcast, state: nextBroadcastState },
          };
          this.host.requestUpdate();
        }
      });
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
              action: async () => {
                window.dispatchEvent(
                  new CustomEvent("ledger-internal-sign", {
                    bubbles: true,
                    composed: true,
                    detail: {
                      status: "error",
                      error: error,
                    },
                  }),
                );
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
              action: async () => {
                if (!this.currentTransaction) {
                  return;
                }
                this.startSigning(this.currentTransaction);
                this.host.requestUpdate();
              },
            },
            cta2: {
              label: lang.error.device.BlindSigningDisabled.cta2,
              action: async () => {
                window.dispatchEvent(
                  new CustomEvent("ledger-internal-sign", {
                    bubbles: true,
                    composed: true,
                    detail: {
                      status: "error",
                      error: error,
                    },
                  }),
                );
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
              action: async () => {
                if (!this.currentTransaction) {
                  return;
                }
                this.startSigning(this.currentTransaction);
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
              action: async () => {
                if (!this.currentTransaction) {
                  return;
                }
                this.state = {
                  screen: "signing",
                  deviceAnimation: "continueOnLedger",
                };
                this.startSigning(this.currentTransaction);
                this.host.requestUpdate();
              },
            },
          },
        };
        break;
      }
      case error instanceof DeviceOutOfStorageError: {
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
              action: async () => {
                if (!this.currentTransaction) {
                  return;
                }
                this.startSigning(this.currentTransaction);
                this.host.requestUpdate();
              },
            },
            cta2: {
              label: lang.error.generic.sign.cta2,
              action: async () => {
                window.dispatchEvent(
                  new CustomEvent("ledger-internal-sign", {
                    bubbles: true,
                    composed: true,
                    detail: {
                      status: "error",
                      error: error,
                    },
                  }),
                );
                this.close();
              },
            },
          },
        };
        break;
      }
    }
  }

  private async prefetchTransactionExplorerUrlTemplate(): Promise<
    string | undefined
  > {
    const currencyId = this.core.getSelectedAccount()?.currencyId;
    if (!currencyId) {
      return undefined;
    }

    try {
      const { transactionExplorerUrlTemplate } =
        await this.core.getCurrencyInfo(currencyId);
      return transactionExplorerUrlTemplate;
    } catch {
      return undefined;
    }
  }

  private async handleSignSuccess(data: SignedResults) {
    const prefetch = this.explorerTemplatePrefetch;
    const transactionExplorerUrlTemplate = isBroadcastedTransactionResult(data)
      ? await prefetch
      : undefined;

    if (this.explorerTemplatePrefetch !== prefetch) {
      return;
    }

    this.state = this.mapSuccessToState(data, transactionExplorerUrlTemplate);
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
