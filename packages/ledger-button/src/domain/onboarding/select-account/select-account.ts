import "@ledgerhq/ledger-button-ui";

import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { coreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { SelectAccountController } from "./select-account-controller.js";

@customElement("select-account-screen")
export class SelectAccountScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  controller!: SelectAccountController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SelectAccountController(
      this,
      this.coreContext,
      this.navigation,
    );
  }

  override render() {
    // TODO: .token should be a Ticker
    return html`
      <div>
        ${this.controller.accounts.map(
          (account) => html`
            <ledger-account-item
              .title=${account.name}
              .address=${account.freshAddress}
              .token=${account.currencyId}
            ></ledger-account-item>
          `,
        )}
      </div>
    `;
  }
}
