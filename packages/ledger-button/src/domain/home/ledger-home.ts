import "@ledgerhq/ledger-button-ui";

import { Account } from "@ledgerhq/ledger-button-core";
import {
  AccountItemClickEventDetail,
  tailwindElement,
} from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
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

  // TODO: Replace this monstrosity with a proper mapping
  private getTicker(currencyId: string) {
    switch (currencyId) {
      case "ethereum":
        return "ETH";
      case "bitcoin":
        return "BTC";
      default:
        return "";
    }
  }

  private handleAccountItemClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    console.log("account-item-click", event);
  };

  private handleAccountItemShowTokensClick = (event: CustomEvent<Account>) => {
    console.log("account-item-show-tokens-click", event);
  };

  override render() {
    const account = this.controller.getSelectedAccount();
    if (!account) {
      return;
    }

    return html` <div class="flex flex-col gap-12 p-24 pt-0"></div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-home-screen": LedgerHomeScreen;
  }
}
