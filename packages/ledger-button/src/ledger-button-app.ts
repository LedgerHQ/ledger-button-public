import "@ledgerhq/ledger-button-ui";
import "./shared/root-navigation.js";
import "./context/language-context.js";
import "./context/core-context.js";
import "./shared/routes.js";

import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import {
  type AccountItemClickEventDetail,
  tailwindElement,
} from "@ledgerhq/ledger-button-ui";
import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import { RootNavigationComponent } from "./shared/root-navigation.js";
import { Destination } from "./shared/routes.js";
import { LedgerButtonAppController } from "./ledger-button-app-controller.js";

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
  }

  private handleAccountSelected(e: CustomEvent<AccountItemClickEventDetail>) {
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
  }

  private handleLedgerButtonDisconnect() {
    this.root.closeModal();
  }

  private handleAccountSwitch() {
    this.root.rootNavigationController.navigation.navigateTo(
      this.root.rootNavigationController.destinations.fetchAccounts,
    );
  }

  public navigationIntent(intent: Destination["name"]) {
    this.root.navigationIntent(intent);
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
  }
}
