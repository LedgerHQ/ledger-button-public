import "../../components/index.js";

import type { Network } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { tailwindElement } from "../../tailwind-element.js";
import { formatFiatBalance } from "../../utils/format-fiat.js";
import { AvailableNetworksController } from "./available-networks-controller.js";

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

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private renderNetworkItem(network: Network) {
    return html`
      <ledger-chain-item
        ledger-id=${network.id}
        .title=${network.name}
        .value=${formatFiatBalance(network.fiatBalance)}
        .isClickable=${false}
        type="network"
        iconVariant="square"
      ></ledger-chain-item>
    `;
  }

  private renderNetworkList() {
    if (!this.controller.networks.length) {
      return nothing;
    }

    return html`
      <div class="flex flex-col gap-12">
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
      <div class="h-full overflow-y-auto p-24">
        ${this.renderNetworkList()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "available-networks-screen": AvailableNetworksScreen;
  }
}
