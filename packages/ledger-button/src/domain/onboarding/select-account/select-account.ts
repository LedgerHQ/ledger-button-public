import "@ledgerhq/ledger-button-ui";

import { Account, LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { tailwindElement } from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { SelectAccountController } from "./select-account-controller.js";

@customElement("select-account-screen")
@tailwindElement()
export class SelectAccountScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @property({ type: Boolean })
  shouldRefreshAccounts = false;

  @property({ type: Object })
  public setLabel!: (label?: string) => void;

  controller!: SelectAccountController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SelectAccountController(
      this,
      this.coreContext,
      this.navigation,
      this.shouldRefreshAccounts,
    );
    this.setupEventListeners();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListeners();
  }

  private setupEventListeners() {
    // @ts-expect-error - Why you no type
    this.addEventListener("account-item-click", this.handleAccountItemClick);
    // @ts-expect-error - Why you no type
    this.addEventListener(
      "account-item-show-tokens-click",
      this.handleAccountItemShowTokensClick,
    );
  }

  private removeEventListeners() {
    // @ts-expect-error - Why you no type
    this.removeEventListener("account-item-click", this.handleAccountItemClick);
    // @ts-expect-error - Why you no type
    this.removeEventListener(
      "account-item-show-tokens-click",
      this.handleAccountItemShowTokensClick,
    );
  }

  private handleAccountItemClick = (
    event: CustomEvent<{
      title: string;
      address: string;
      ticker: string;
      ledgerId: string;
      value: string;
      linkLabel: string;
      timestamp: number;
    }>,
  ) => {
    console.log("account-item-click", event.detail);
    this.controller.selectAccount(event.detail.address);
    this.setLabel(event.detail.title);
  };

  private handleAccountItemShowTokensClick = (event: CustomEvent<Account>) => {
    console.log("account-item-show-tokens-click", event);
  };

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

  renderAccountItem = (account: Account) => {
    const translations = this.languages.currentTranslation;

    // NOTE: The label should be displayed only if the account has tokens
    return html`
      <ledger-account-item
        .title=${account.name}
        .address=${account.freshAddress}
        .linkLabel=${translations.onboarding.selectAccount.showTokens}
        .ledgerId=${account.currencyId}
        .ticker=${this.getTicker(account.currencyId)}
      ></ledger-account-item>
    `;
  };

  override render() {
    return html`
      <div class="flex flex-col gap-12 px-24 pb-24">
        ${this.controller.accounts.map(this.renderAccountItem)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "select-account-screen": SelectAccountScreen;
  }
}
