import "../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { AccountItemClickEventDetail } from "../../components/molecule/account-item/ledger-account-item.js";
import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import { LedgerHomeController } from "./ledger-home-controller.js";

@customElement("ledger-home-screen")
@tailwindElement()
export class LedgerHomeScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @property({ type: Boolean })
  demoMode = false;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: LedgerHomeController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new LedgerHomeController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
      this.demoMode,
    );
  }

  private handleAccountItemClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-account-switch", {
        bubbles: true,
        composed: true,
        detail: event.detail,
      }),
    );
  };

  private handleDisconnectClick = async () => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-button-disconnect", {
        bubbles: true,
        composed: true,
      }),
    );
    await this.controller.handleDisconnectClick();
  };

  override render() {
    const account = this.controller.getSelectedAccount();
    if (!account) {
      return html`<div>No account selected</div>`;
    }

    const lang = this.languages.currentTranslation;

    // TODO: Fetch account balance
    const balance = 1234.56;

    return html`
      <div class="flex flex-col items-stretch gap-24 p-24 pt-0">
        <div class="flex flex-col gap-32 rounded-md bg-muted p-16">
          <div class="flex flex-row items-center justify-between">
            <ledger-account-switch
              .account=${account}
              @account-switch=${this.handleAccountItemClick}
            ></ledger-account-switch>
            <ledger-crypto-icon
              .ledgerId=${account.currencyId}
              size="small"
              variant="square"
            ></ledger-crypto-icon>
          </div>
          <div class="flex flex-row items-center justify-between">
            <ledger-balance
              label=${lang.home.balance}
              .balance=${balance}
              .ticker=${account.ticker}
            ></ledger-balance>
          </div>
        </div>
        <ledger-button
          variant="secondary"
          size="full"
          label=${lang.common.button.disconnect}
          @click=${this.handleDisconnectClick}
        ></ledger-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-home-screen": LedgerHomeScreen;
  }

  interface WindowEventMap {
    "ledger-internal-button-disconnect": CustomEvent<void>;
    "ledger-internal-account-switch": CustomEvent<AccountItemClickEventDetail>;
  }
}
