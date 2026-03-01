import "../../../components/atom/crypto-icon/ledger-crypto-icon.js";

import type { Network } from "@ledgerhq/ledger-wallet-provider-core";
import { cva } from "class-variance-authority";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

const MAX_VISIBLE_NETWORKS = 3;

export interface NetworksClickEventDetail {
  networks: Network[];
}

const containerVariants = cva([
  "flex cursor-pointer items-center gap-4 rounded-full px-8 py-4",
  "bg-muted-transparent hover:bg-muted-transparent-hover active:bg-muted-transparent-pressed",
]);

const overflowVariants = cva(["caption text-muted"]);

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

  private get overflowClasses() {
    return {
      [overflowVariants()]: true,
    };
  }

  private renderNetworkIcons() {
    const visible = this.networks.slice(0, MAX_VISIBLE_NETWORKS);
    return visible.map(
      (network) => html`
        <ledger-crypto-icon
          .ledgerId=${network.name}
          size="small"
          variant="square"
        ></ledger-crypto-icon>
      `,
    );
  }

  private renderOverflow() {
    const overflowCount = this.networks.length - MAX_VISIBLE_NETWORKS;
    if (overflowCount <= 0) {
      return nothing;
    }
    return html`<span class=${classMap(this.overflowClasses)}
      >+${overflowCount}</span
    >`;
  }

  override render() {
    if (this.networks.length === 0) {
      return nothing;
    }

    return html`
      <button
        class=${classMap(this.containerClasses)}
        aria-label="Networks"
        @click=${this.handleClick}
        @keydown=${this.handleKeydown}
      >
        ${this.renderNetworkIcons()} ${this.renderOverflow()}
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
