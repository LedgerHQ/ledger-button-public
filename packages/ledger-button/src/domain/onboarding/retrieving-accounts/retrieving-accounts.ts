import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { backgroundFlare } from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { coreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RetrievingAccountsController } from "./retrieving-accounts-controller.js";

@customElement("retrieving-accounts-screen")
export class RetrievingAccountsScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  controller!: RetrievingAccountsController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new RetrievingAccountsController(
      this,
      this.coreContext,
      this.navigation,
    );
  }

  override render() {
    return html`
      <div class="min-h-96">
        <ledger-lottie
          .animationData=${backgroundFlare}
          .autoplay=${true}
          .loop=${true}
        ></ledger-lottie>
      </div>
    `;
  }
}
