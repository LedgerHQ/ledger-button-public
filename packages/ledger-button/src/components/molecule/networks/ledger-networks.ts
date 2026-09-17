import "../../../components/atom/crypto-icon-group/ledger-crypto-icon-group";

import type { Network } from "@ledgerhq/ledger-wallet-provider-core";
import { cva } from "class-variance-authority";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element";

const MAX_VISIBLE_NETWORKS = 3;

export interface NetworksClickEventDetail {
  networks: Network[];
}

const containerVariants = cva([
  "flex cursor-pointer items-center rounded-sm p-4",
  "bg-muted-transparent hover:bg-muted-transparent-hover active:bg-muted-transparent-pressed",
]);

@customElement("ledger-networks")
@tailwindElement()
export class LedgerNetworks extends LitElement {
  @property({ type: Array })
  networks: Network[] = [];

  private get containerClasses() {
    return {
      [containerVariants()]: true,
    };
  }

  override render() {
    if (this.networks.length === 0) {
      return nothing;
    }

    return html`
      <button
        class="${classMap(this.containerClasses)}"
        aria-label="Networks"
        @click=${this.handleClick}
        @keydown=${this.handleKeydown}
      >
        <ledger-crypto-icon-group
          .items=${this.networks}
          max-visible=${MAX_VISIBLE_NETWORKS}
        ></ledger-crypto-icon-group>
      </button>
    `;
  }

  private handleClick() {
    this.dispatchEvent(
      new CustomEvent<NetworksClickEventDetail>("networks-click", {
        bubbles: true,
        composed: true,
        detail: {
          networks: this.networks,
        },
      }),
    );
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleClick();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-networks": LedgerNetworks;
  }

  interface WindowEventMap {
    "networks-click": CustomEvent<NetworksClickEventDetail>;
  }
}

export default LedgerNetworks;
