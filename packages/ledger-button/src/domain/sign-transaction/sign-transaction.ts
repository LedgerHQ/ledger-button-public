import "../../components/index.js";
import "../onboarding/ledger-sync/ledger-sync";

import {
  isSignedMessageOrTypedDataResult,
  isSignedTransactionResult,
  type SignedResults,
  SignPersonalMessageParams,
  SignRawTransactionParams,
  type SignTransactionParams,
  SignTypedMessageParams,
} from "@ledgerhq/ledger-button-core";
import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { type StatusType } from "../../components/organism/status/ledger-status.js";
import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import { SignTransactionController } from "./sign-transaction-controller.js";

export type SignTransactionState = "signing" | "success" | "error";

const styles = css`
  :host {
    animation: intro 250ms ease-in-out;
    transform-origin: left bottom;
  }

  :host(.remove) {
    animation: intro 250ms ease-in-out reverse;
  }

  @keyframes intro {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(32px);
    }

    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

type Params = SignTransactionParams & {
  broadcast: boolean;
};

@customElement("sign-transaction-screen")
@tailwindElement(styles)
export class SignTransactionScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @property({ type: String })
  state: SignTransactionState = "signing";

  @property({ type: String })
  transactionId = "";

  @property({ type: Object })
  transactionParams?:
    | SignTransactionParams
    | SignPersonalMessageParams
    | SignRawTransactionParams
    | SignTypedMessageParams;

  @property({ type: Object })
  params?: unknown;

  @property({ type: Boolean, attribute: false })
  broadcast = false;

  controller!: SignTransactionController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SignTransactionController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );

    if (this.isParams(this.params)) {
      this.broadcast = this.params.broadcast;
    }

    const transactionParams =
      (this.params as Params) ??
      this.transactionParams ??
      this.coreContext.getPendingTransactionParams();

    if (!transactionParams) {
      console.log("No transaction params");
      this.state = "error";
      this.requestUpdate();
      return;
    }

    this.transactionParams = transactionParams;
    this.controller.startSigning(transactionParams, this.broadcast);
  }

  private isParams(params: unknown): params is Params {
    return (
      typeof params === "object" &&
      params !== null &&
      "transaction" in params &&
      "broadcast" in params
    );
  }

  private renderSigningState() {
    const lang = this.languageContext.currentTranslation;
    const animation = "signTransaction";

    return html`
      <div
        class="min-h-200 flex flex-col items-center justify-center gap-24 self-stretch px-24 pb-48"
      >
        <div class="w-208">
          <ledger-device-animation
            modelId="flex"
            animation=${animation}
          ></ledger-device-animation>
        </div>
        <div class="flex flex-col items-center gap-8 self-stretch">
          <p class="text-center body-1">
            ${lang.common.device.deviceActions.continueOnLedger.title}
            ${lang.common.device.model["flex"]}
          </p>
          <p class="text-center text-muted body-2">
            ${lang.common.device.deviceActions.continueOnLedger.description}
          </p>
        </div>
      </div>
    `;
  }

  private renderSuccessState() {
    const lang = this.languageContext.currentTranslation;

    if (this.controller.result) {
      if (isSignedTransactionResult(this.controller.result)) {
        window.dispatchEvent(
          new CustomEvent<SignedResults>("ledger-internal-sign-transaction", {
            bubbles: true,
            composed: true,
            detail: this.controller.result,
          }),
        );
      } else if (isSignedMessageOrTypedDataResult(this.controller.result)) {
        window.dispatchEvent(
          new CustomEvent<string>("ledger-internal-sign-message", {
            bubbles: true,
            composed: true,
            detail: this.controller.result.signature,
          }),
        );
      }
    }

    return html`
      <div
        class="flex min-h-0 flex-col items-stretch justify-center self-stretch p-24 pt-0"
      >
        <ledger-status
          type="success"
          title=${lang.signTransaction?.success?.title || "Transaction signed"}
          description=${lang.signTransaction?.success?.description ||
          "You will receive the funds soon."}
          primary-button-label=${lang.common.button.close || "Close"}
          secondary-button-label=${lang.signTransaction?.success
            ?.viewTransaction || "View transaction details"}
          @status-action=${this.handleStatusAction}
        ></ledger-status>
      </div>
    `;
  }

  private renderErrorState() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div
        class="flex min-h-0 flex-col items-stretch justify-center self-stretch p-24 pt-0"
      >
        <ledger-status
          type="error"
          title=${lang.signTransaction?.error?.title || "Transaction failed"}
          description=${lang.signTransaction?.error?.description ||
          "There was an error signing your transaction. Please try again."}
          primary-button-label=${lang.common.button.tryAgain || "Try Again"}
          secondary-button-label=${lang.common.button.close || "Close"}
          @status-action=${this.handleStatusAction}
        ></ledger-status>
      </div>
    `;
  }

  private handleStatusAction(
    event: CustomEvent<{
      timestamp: number;
      action: "primary" | "secondary";
      type: StatusType;
    }>,
  ) {
    const { action, type } = event.detail;

    if (type === "success") {
      if (action === "primary") {
        this.handleClose();
      } else if (action === "secondary") {
        this.handleViewTransaction();
      }
    } else if (type === "error") {
      if (action === "primary") {
        this.handleRetry();
      } else if (action === "secondary") {
        this.handleClose();
      }
    }
  }

  private handleViewTransaction() {
    this.controller.viewTransactionDetails(this.transactionId);
  }

  private handleClose() {
    this.controller.close();
  }

  private handleRetry() {
    this.state = "signing";
    if (!this.transactionParams) {
      this.state = "error";
      this.requestUpdate();
      return;
    }
    this.controller.startSigning(this.transactionParams, this.broadcast);
  }

  override render() {
    switch (this.state) {
      case "signing":
        return this.renderSigningState();
      case "success":
        return this.renderSuccessState();
      case "error":
        return this.renderErrorState();
      default:
        return this.renderSigningState();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sign-transaction-screen": SignTransactionScreen;
  }

  interface WindowEventMap {
    "ledger-internal-send-transaction": CustomEvent<SignedResults>;
    "ledger-internal-sign-transaction": CustomEvent<SignedResults>;
    "ledger-internal-sign-message": CustomEvent<SignedResults>;
  }
}
