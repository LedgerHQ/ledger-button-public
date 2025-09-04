import "./components/index.js";
import "./shared/root-navigation.js";
import "./context/language-context.js";
import "./context/core-context.js";
import "./shared/routes.js";

import {
  Account,
  LedgerButtonCore,
  Signature,
  SignedTransaction,
} from "@ledgerhq/ledger-button-core";
import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import { RootNavigationComponent } from "./shared/root-navigation.js";
import { Destination } from "./shared/routes.js";
import { LedgerButtonAppController } from "./ledger-button-app-controller.js";
import { tailwindElement } from "./tailwind-element.js";

@customElement("ledger-button-app")
@tailwindElement()
export class LedgerButtonApp extends LitElement {
  @query("#navigation")
  root!: RootNavigationComponent;

  @property({ type: Object })
  core!: LedgerButtonCore;

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
      "ledger-internal-sign-transaction",
      this.handleSignTransaction,
    );
    window.addEventListener(
      "ledger-internal-send-transaction",
      this.handleSendTransaction,
    );
    window.addEventListener(
      "ledger-internal-sign-typed-data",
      this.handleSignTypedData,
    );
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
      "ledger-internal-sign-transaction",
      this.handleSignTransaction,
    );
    window.removeEventListener(
      "ledger-internal-send-transaction",
      this.handleSendTransaction,
    );
    window.removeEventListener(
      "ledger-internal-sign-typed-data",
      this.handleSignTypedData,
    );
  }

  // NOTE: Handlers should be defined as arrow functions to avoid losing "this" context
  // when passed to window.addEventListener
  private handleAccountSelected = (e: CustomEvent<Account>) => {
    window.dispatchEvent(
      new CustomEvent<{ account: Account }>(
        "ledger-provider-account-selected",
        {
          bubbles: true,
          composed: true,
          detail: { account: e.detail },
        },
      ),
    );
  };

  private handleSignTransaction = (e: CustomEvent<SignedTransaction>) => {
    window.dispatchEvent(
      new CustomEvent<SignedTransaction>("ledger-provider-sign-transaction", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  };

  private handleSendTransaction = (e: CustomEvent<SignedTransaction>) => {
    window.dispatchEvent(
      new CustomEvent<SignedTransaction>("ledger-provider-send-transaction", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  };

  private handleLedgerButtonDisconnect = () => {
    this.root.closeModal();
  };

  private handleAccountSwitch = () => {
    this.root.rootNavigationController.navigation.navigateTo(
      this.root.rootNavigationController.destinations.fetchAccounts,
    );
  };

  private handleSignTypedData = (e: CustomEvent<Signature>) => {
    window.dispatchEvent(
      new CustomEvent<Signature>("ledger-provider-sign-typed-data", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  };

  public navigationIntent(intent: Destination["name"], params?: unknown) {
    this.root.navigationIntent(intent, params);
  }

  public disconnect() {
    this.core?.disconnect();
    this.dispatchEvent(
      new CustomEvent("ledger-provider-disconnect", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  openModal() {
    this.root.openModal();
  }

  override render() {
    return html`
      <div class="dark">
        <core-provider .coreClass=${this.core}>
          <language-provider>
            <root-navigation-component
              id="navigation"
            ></root-navigation-component>
          </language-provider>
        </core-provider>
      </div>
    `;
  }
}

// NOTE: Declare here all the custom events so that LedgerEIP1193Provider can have type safey
// Make sure to prefix with "ledger-provider-" (or something else, to be discussed)
declare global {
  interface WindowEventMap {
    "ledger-provider-account-selected": CustomEvent<{ account: Account }>;
    "ledger-provider-sign-transaction": CustomEvent<SignedTransaction>;
    "ledger-provider-send-transaction": CustomEvent<SignedTransaction>;
    "ledger-provider-sign-typed-data": CustomEvent<Signature>;
    "ledger-provider-disconnect": CustomEvent;
  }
}
