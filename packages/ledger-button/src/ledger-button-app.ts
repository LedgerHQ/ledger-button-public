import "./components/index.js";
import "./shared/root-navigation.js";
import "./context/language-context.js";
import "./context/core-context.js";
import "./shared/routes.js";

import {
  Account,
  isBroadcastedTransactionResult,
  isSignedMessageOrTypedDataResult,
  isSignedTransactionResult,
  LedgerButtonCore,
  SignedResults,
} from "@ledgerhq/ledger-wallet-provider-core";
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
    window.addEventListener("ledger-internal-sign", this.handleSign);
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
    window.removeEventListener("ledger-internal-sign", this.handleSign);
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

  private handleSign = (
    e: CustomEvent<
      | { status: "success"; data: SignedResults }
      | { status: "error"; error: unknown }
    >,
  ) => {
    if (e.detail.status === "error") {
      window.dispatchEvent(
        new CustomEvent<{ status: "error"; error: unknown }>(
          "ledger-provider-sign",
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
      if (
        isBroadcastedTransactionResult(e.detail.data) ||
        isSignedTransactionResult(e.detail.data) ||
        isSignedMessageOrTypedDataResult(e.detail.data)
      ) {
        window.dispatchEvent(
          new CustomEvent<{
            status: "success";
            data: SignedResults;
          }>("ledger-provider-sign", {
            bubbles: true,
            composed: true,
            detail: {
              status: "success",
              data: e.detail.data,
            },
          }),
        );
      }
    }
  };

  private handleLedgerButtonDisconnect = () => {
    this.root.closeModal();
  };

  private handleAccountSwitch = () => {
    this.root.rootNavigationController.navigation.navigateTo(
      this.root.rootNavigationController.destinations.fetchAccounts,
    );
  };

  private handleFloatingButtonClick = () => {
    this.navigationIntent("selectAccount");
  };

  public navigationIntent(intent: Destination["name"], params?: unknown) {
    this.root.navigationIntent(intent, params);
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

  override render() {
    return html`
      <div class="dark">
        <core-provider .coreClass=${this.core}>
          <language-provider>
            <root-navigation-component
              id="navigation"
            ></root-navigation-component>
            <ledger-floating-button></ledger-floating-button>
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
    "ledger-provider-sign": CustomEvent<
      | {
          status: "success";
          data: SignedResults;
        }
      | {
          status: "error";
          error: unknown;
        }
    >;
    "ledger-provider-disconnect": CustomEvent;
  }
}
