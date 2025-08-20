import "./components/index.js";
import "./shared/root-navigation.js";
import "./context/language-context.js";
import "./context/core-context.js";
import "./shared/routes.js";

import {
  LedgerButtonCore,
  SignedTransaction,
} from "@ledgerhq/ledger-button-core";
import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import type { AccountItemClickEventDetail } from "./components/molecule/account-item/ledger-account-item.js";
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
  core?: LedgerButtonCore;

  controller!: LedgerButtonAppController;

  private _accounts: string[] = [];

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new LedgerButtonAppController(this);

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
  }

  // NOTE: Handlers should be defined as arrow functions to avoid losing "this" context
  // when passed to window.addEventListener
  private handleAccountSelected = (
    e: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    if (!this._accounts) {
      this._accounts = [];
    }

    const found = this._accounts.find((a) => a === e.detail.address);

    if (!found) {
      this._accounts.pop();
      this._accounts.push(e.detail.address);
    }

    window.dispatchEvent(
      new CustomEvent<{ accounts: string[] }>(
        "ledger-provider-account-selected",
        {
          bubbles: true,
          composed: true,
          detail: { accounts: this._accounts },
        },
      ),
    );
  };

  private handleSignTransaction = (e: CustomEvent<SignedTransaction>) => {
    console.log("handleSignTransaction", e);
    window.dispatchEvent(
      new CustomEvent<SignedTransaction>("ledger-provider-sign-transaction", {
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
    "ledger-provider-account-selected": CustomEvent<{ accounts: string[] }>;
    "ledger-provider-sign-transaction": CustomEvent<SignedTransaction>;
    "ledger-provider-disconnect": CustomEvent;
  }
}
