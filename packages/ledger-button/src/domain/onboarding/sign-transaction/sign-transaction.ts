import "@ledgerhq/ledger-button-ui";

import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
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

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @property({ type: String })
  state: SignTransactionState = "signing";

  @property({ type: String })
  deviceModel = "stax";

  @property({ type: String })
  transactionId = "";

  controller!: SignTransactionController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SignTransactionController(this, this.navigation);
    this.controller.startSigning();
  }

  private renderSigningState() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div
        class="min-h-400 flex flex-col items-center justify-center text-center"
      >
        <div class="w-full max-w-300 h-240 mb-32">
          <ledger-device-animation
            .modelId=${this.deviceModel}
            animation="signTransaction"
            .autoplay=${true}
            .loop=${true}
          ></ledger-device-animation>
        </div>

        <h2 class="font-semibold mb-16 text-white heading-4">
          ${(lang as any).signTransaction?.continueOnDevice?.title ||
          "Continue on your"}
          ${(lang.common.device.model as any)[this.deviceModel] ||
          this.deviceModel}
        </h2>

        <p class="max-w-280 text-white opacity-60 body-1">
          ${(lang as any).signTransaction?.continueOnDevice?.description ||
          "Follow the instructions displayed on your Secure Touchscreen."}
        </p>
      </div>
    `;
  }

  private renderSuccessState() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div
        class="min-h-400 flex flex-col items-center justify-center text-center"
      >
        <div class="mb-32 flex items-center justify-center">
          <div
            class="bg-green-600 flex h-80 w-80 items-center justify-center rounded-full bg-opacity-20"
          >
            <div
              class="bg-green-500 flex h-48 w-48 items-center justify-center rounded-full"
            >
              <ledger-icon
                type="check"
                size="medium"
                class="text-white"
              ></ledger-icon>
            </div>
          </div>
        </div>

        <h2 class="font-semibold mb-16 text-white heading-4">
          ${(lang as any).signTransaction?.success?.title ||
          "Transaction signed"}
        </h2>

        <p class="max-w-280 mb-32 text-white opacity-60 body-1">
          ${(lang as any).signTransaction?.success?.description ||
          "You will receive the funds soon."}
        </p>

        <div class="w-full max-w-280 flex flex-col gap-16">
          <ledger-button
            label=${(lang as any).signTransaction?.success?.viewTransaction ||
            "View transaction details"}
            variant="secondary"
            size="large"
            class="w-full"
            @click=${this.handleViewTransaction}
          ></ledger-button>

          <ledger-button
            label=${(lang.common.button as any).close || "Close"}
            variant="primary"
            size="large"
            class="w-full"
            @click=${this.handleClose}
          ></ledger-button>
        </div>
      </div>
    `;
  }

  private renderErrorState() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div
        class="min-h-400 flex flex-col items-center justify-center text-center"
      >
        <div class="mb-32 flex items-center justify-center">
          <div
            class="bg-red-600 flex h-80 w-80 items-center justify-center rounded-full bg-opacity-20"
          >
            <div
              class="bg-red-500 flex h-48 w-48 items-center justify-center rounded-full"
            >
              <ledger-icon
                type="error"
                size="medium"
                class="text-white"
              ></ledger-icon>
            </div>
          </div>
        </div>

        <h2 class="font-semibold mb-16 text-white heading-4">
          ${(lang as any).signTransaction?.error?.title || "Transaction failed"}
        </h2>

        <p class="max-w-280 mb-32 text-white opacity-60 body-1">
          ${(lang as any).signTransaction?.error?.description ||
          "There was an error signing your transaction. Please try again."}
        </p>

        <div class="w-full max-w-280 flex flex-col gap-16">
          <ledger-button
            label=${(lang.common.button as any).tryAgain || "Try Again"}
            variant="primary"
            size="large"
            class="w-full"
            @click=${this.handleRetry}
          ></ledger-button>

          <ledger-button
            label=${(lang.common.button as any).close || "Close"}
            variant="secondary"
            size="large"
            class="w-full"
            @click=${this.handleClose}
          ></ledger-button>
        </div>
      </div>
    `;
  }

  private handleViewTransaction() {
    this.controller.viewTransactionDetails(this.transactionId);
  }

  private handleClose() {
    this.controller.close();
  }

  private handleRetry() {
    this.state = "signing";
    this.controller.startSigning();
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
