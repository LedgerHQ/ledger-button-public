import "../../components/index";

import { type Network } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context";
import { Navigation } from "../../shared/navigation";
import { tailwindElement } from "../../tailwind-element";
import {
  formatFiatBalance,
  formatTokenBalance,
} from "../../utils/format-fiat";
import { AvailableNetworksController } from "./available-networks-controller";

@customElement("available-networks-screen")
@tailwindElement()
export class AvailableNetworksScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  controller!: AvailableNetworksController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new AvailableNetworksController(
      this,
      this.coreContext,
      this.navigation,
    );
  }

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private handleNetworkClick(network: Network) {
    this.controller.selectNetwork(network.id);
  }

  private renderNetworkItem(network: Network) {
    return html`
      <ledger-chain-item
        ledger-id=${network.id}
        ticker=${network.ticker ?? ""}
        .title=${network.name}
        .value=${network.balance
          ? formatTokenBalance(network.balance, this.languages.locale)
          : ""}
        .fiatValue=${formatFiatBalance(
          network.totalFiatBalance,
          this.languages.locale,
        )}
        .isClickable=${true}
        type="network"
        iconVariant="square"
        @chain-item-click=${() => this.handleNetworkClick(network)}
      ></ledger-chain-item>
    `;
  }

  private renderNetworkList() {
    if (!this.controller.networks.length) {
      return nothing;
    }

    return html`
      <div class="flex flex-col">
        ${this.controller.networks.map((n) => this.renderNetworkItem(n))}
      </div>
    `;
  }

  override render() {
    if (this.controller.loading) {
      return html`
        <div class="flex flex-col gap-12 p-24">
          <ledger-skeleton class="h-64 w-full rounded-xl"></ledger-skeleton>
          <ledger-skeleton class="h-64 w-full rounded-xl"></ledger-skeleton>
          <ledger-skeleton class="h-64 w-full rounded-xl"></ledger-skeleton>
        </div>
      `;
    }

    return html`
      <div class="h-full overflow-y-auto p-24">${this.renderNetworkList()}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "available-networks-screen": AvailableNetworksScreen;
  }
}
