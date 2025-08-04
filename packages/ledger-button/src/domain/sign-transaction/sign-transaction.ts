import "@ledgerhq/ledger-button-ui";
import "../onboarding/ledger-sync/ledger-sync";

import { SignTransactionParams } from "@ledgerhq/ledger-button-core";
import { tailwindElement } from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
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
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @property({ type: String })
  state: SignTransactionState = "signing";

  @property({ type: String })
  transactionId = "";

  @property({ type: Object })
  transactionParams?: SignTransactionParams;

  controller!: SignTransactionController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SignTransactionController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );

    const transactionParams =
      this.transactionParams || this.coreContext.getPendingTransactionParams();

    if (!transactionParams) {
      this.state = "error";
      this.requestUpdate();
      return;
    }

    this.transactionParams = transactionParams;
    this.controller.startSigning(transactionParams);
  }

  private renderSigningState() {
    return html`
      <ledger-sync-screen
        .navigation=${this.navigation}
        .destinations=${this.destinations}
        .pendingTransactionParams=${this.transactionParams}
      ></ledger-sync-screen>
    `;
  }

  private renderSuccessState() {
    const lang = this.languageContext.currentTranslation;

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
    if (!this.transactionParams) {
      this.state = "error";
      this.requestUpdate();
      return;
    }
    this.controller.startSigning(this.transactionParams);
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
