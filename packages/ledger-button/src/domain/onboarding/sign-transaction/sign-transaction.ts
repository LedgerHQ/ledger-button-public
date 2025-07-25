import "@ledgerhq/ledger-button-ui";

import {
  LedgerButtonCore,
  TransactionData,
} from "@ledgerhq/ledger-button-core";
import { tailwindElement } from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";
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

@customElement("sign-transaction-screen")
@tailwindElement(styles)
export class SignTransactionScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @property({ type: String })
  state: SignTransactionState = "signing";

  @property({ type: String })
  deviceModel = "flex";

  @property({ type: String })
  transactionId = "";

  @property({ type: Object })
  transactionData?: TransactionData;

  controller!: SignTransactionController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SignTransactionController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );

    const transactionData =
      this.transactionData || (this.coreContext as any)._pendingTransactionData;

    if (!transactionData) {
      this.state = "error";
      this.requestUpdate();
      return;
    }

    this.transactionData = transactionData;
    this.controller.startSigning(transactionData);
  }

  private renderSigningState() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div
        class="flex min-h-400 flex-col items-center justify-center p-24 text-center"
      >
        <div class="max-w-300 h-240 mb-32 w-full">
          <ledger-device-animation
            .modelId=${this.deviceModel}
            animation="signTransaction"
            .autoplay=${true}
            .loop=${true}
          ></ledger-device-animation>
        </div>

        <h2 class="text-xl font-semibold mb-16 text-white">
          ${(lang as any).signTransaction?.continueOnDevice?.title ||
          "Continue on your"}
          ${(lang.common.device.model as any)[this.deviceModel] ||
          this.deviceModel}
        </h2>

        <p class="max-w-280 text-sm text-white/60">
          ${(lang as any).signTransaction?.continueOnDevice?.description ||
          "Follow the instructions displayed on your Secure Touchscreen."}
        </p>
      </div>
    `;
  }

  private renderSuccessState() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div class="flex min-h-400 items-center justify-center p-24">
        <ledger-status
          type="success"
          title=${(lang as any).signTransaction?.success?.title ||
          "Transaction signed"}
          description=${(lang as any).signTransaction?.success?.description ||
          "You will receive the funds soon."}
          primary-button-label=${(lang.common.button as any).close || "Close"}
          secondary-button-label=${(lang as any).signTransaction?.success
            ?.viewTransaction || "View transaction details"}
          @status-action=${this.handleStatusAction}
        ></ledger-status>
      </div>
    `;
  }

  private renderErrorState() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div class="flex min-h-400 items-center justify-center p-24">
        <ledger-status
          type="error"
          title=${(lang as any).signTransaction?.error?.title ||
          "Transaction failed"}
          description=${(lang as any).signTransaction?.error?.description ||
          "There was an error signing your transaction. Please try again."}
          primary-button-label=${(lang.common.button as any).tryAgain ||
          "Try Again"}
          secondary-button-label=${(lang.common.button as any).close || "Close"}
          @status-action=${this.handleStatusAction}
        ></ledger-status>
      </div>
    `;
  }

  private handleStatusAction(event: CustomEvent) {
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
    if (!this.transactionData) {
      this.state = "error";
      this.requestUpdate();
      return;
    }
    this.controller.startSigning(this.transactionData);
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
