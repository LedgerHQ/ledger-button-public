import "./components/index.js";
import "./components/molecule/transaction-notifications/ledger-transaction-confirmation-host.js";
import "./shared/root-navigation.js";
import "./context/language-context.js";
import "./context/core-context.js";
import "./shared/routes.js";

import {
  Account,
  LedgerButtonCore,
  type WalletNavigationIntent,
} from "@ledgerhq/ledger-wallet-provider-core";
import { html, LitElement, nothing } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import type { FloatingButtonPosition as FloatingButtonPositionComponent } from "./components/atom/floating-button/ledger-floating-button.js";
import { ModalMode } from "./components/index.js";
import type { WalletTransactionFeature } from "./components/molecule/wallet-actions/ledger-wallet-actions.js";
import { RootNavigationComponent } from "./shared/root-navigation.js";
import { Destination } from "./shared/routes.js";
import type { TransactionConfirmationNotification } from "./types/transaction-confirmation-notification.js";
import { LedgerButtonAppController } from "./ledger-button-app-controller.js";
import { tailwindElement } from "./tailwind-element.js";

type FloatingButtonPosition = FloatingButtonPositionComponent | false;

@customElement("ledger-button-app")
@tailwindElement()
export class LedgerButtonApp extends LitElement {
  @query("#navigation")
  root!: RootNavigationComponent;

  @property({ type: Object })
  core!: LedgerButtonCore;

  @property({ attribute: false })
  floatingButtonPosition: FloatingButtonPosition = "bottom-right";

  @property({ type: Array })
  walletTransactionFeatures?: WalletTransactionFeature[];

  @property({ type: String, attribute: false })
  transactionConfirmationNotification: TransactionConfirmationNotification =
    "tooltip";

  controller!: LedgerButtonAppController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new LedgerButtonAppController(this, this.core);

    window.addEventListener(
      "ledger-internal-account-selected",
      this.handleAccountSelected,
    );
    window.addEventListener(
      "ledger-internal-button-disconnect",
      this.handleLedgerButtonDisconnect,
    );
    window.addEventListener(
      "ledger-internal-account-switch",
      this.handleAccountSwitch,
    );
    window.addEventListener(
      "ledger-internal-floating-button-click",
      this.handleFloatingButtonClick,
    );
  }

  get isModalOpen() {
    return this.root.isModalOpen;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      "ledger-internal-account-selected",
      this.handleAccountSelected,
    );
    window.removeEventListener(
      "ledger-internal-button-disconnect",
      this.handleLedgerButtonDisconnect,
    );
    window.removeEventListener(
      "ledger-internal-account-switch",
      this.handleAccountSwitch,
    );
    window.removeEventListener(
      "ledger-internal-floating-button-click",
      this.handleFloatingButtonClick,
    );
  }

  // NOTE: Handlers should be defined as arrow functions to avoid losing "this" context
  // when passed to window.addEventListener
  private handleAccountSelected = (
    e: CustomEvent<
      | { account: Account; status: "success" }
      | { status: "error"; error: unknown }
    >,
  ) => {
    if (e.detail.status === "error") {
      window.dispatchEvent(
        new CustomEvent<{ status: "error"; error: unknown }>(
          "ledger-provider-account-selected",
          {
            bubbles: true,
            composed: true,
            detail: e.detail,
          },
        ),
      );
      return;
    }

    if (e.detail.status === "success") {
      window.dispatchEvent(
        new CustomEvent<{ account: Account; status: "success" }>(
          "ledger-provider-account-selected",
          {
            bubbles: true,
            composed: true,
            detail: { account: e.detail.account, status: "success" },
          },
        ),
      );
    }
  };

  private handleLedgerButtonDisconnect = () => {
    this.disconnect();
    this.root.closeModal();
  };

  private handleAccountSwitch = () => {
    this.root.rootNavigationController.switchAccount();
  };

  private handleFloatingButtonClick = () => {
    void this.core.trackFloatingButtonClick();
    this.navigationIntent("selectAccount", undefined, "panel");
  };

  public navigationIntent(
    intent: Destination["name"],
    params?: WalletNavigationIntent,
    mode?: ModalMode,
  ) {
    this.root.navigationIntent(intent, params, mode);
  }

  public disconnect() {
    window.dispatchEvent(
      new CustomEvent("ledger-provider-disconnect", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  openModal() {
    this.root.openModal();
  }

  private renderFloatingButton() {
    if (this.floatingButtonPosition === false) {
      return nothing;
    }

    return html`<ledger-floating-button
      .position=${this.floatingButtonPosition}
      .transactionConfirmationNotification=${this
        .transactionConfirmationNotification}
    ></ledger-floating-button>`;
  }

  override render() {
    return html`
      <div class="dark">
        <core-provider .coreClass=${this.core}>
          <language-provider>
            <ledger-transaction-confirmation-host
              confirmation-mode=${this.transactionConfirmationNotification}
            ></ledger-transaction-confirmation-host>
            <root-navigation-component
              id="navigation"
              .walletTransactionFeatures=${this.walletTransactionFeatures}
            ></root-navigation-component>
            ${this.renderFloatingButton()}
          </language-provider>
        </core-provider>
      </div>
    `;
  }
}

// NOTE: Declare here all the custom events so that LedgerEIP1193Provider can have type safey
// Make sure to prefix with "ledger-provider-" (or something else, to be discussed)
declare global {
  interface HTMLElementTagNameMap {
    "ledger-button-app": LedgerButtonApp;
  }

  interface WindowEventMap {
    "ledger-provider-account-selected": CustomEvent<
      | { account: Account; status: "success" }
      | { status: "error"; error: unknown }
    >;
    "ledger-provider-disconnect": CustomEvent;
  }
}
