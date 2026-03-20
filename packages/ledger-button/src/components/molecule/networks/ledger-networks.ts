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

const BORDER_COLOR_DEFAULT =
  "color-mix(in srgb, white 10%, var(--color-background-muted))";
const BORDER_COLOR_HOVER =
  "color-mix(in srgb, white 20%, var(--color-background-muted))";
const BORDER_COLOR_ACTIVE =
  "color-mix(in srgb, white 30%, var(--color-background-muted))";

const containerVariants = cva([
  "flex cursor-pointer items-center rounded-sm p-4",
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

  override render() {
    if (this.networks.length === 0) {
      return nothing;
    }

    const visible = this.networks.slice(0, MAX_VISIBLE_NETWORKS);
    const overflowCount = this.networks.length - MAX_VISIBLE_NETWORKS;

    return html`
      <style>
        .networks-btn {
          --stacked-border-color: ${BORDER_COLOR_DEFAULT};
        }
        .networks-btn:hover {
          --stacked-border-color: ${BORDER_COLOR_HOVER};
        }
        .networks-btn:active {
          --stacked-border-color: ${BORDER_COLOR_ACTIVE};
        }
      </style>
      <button
        class="networks-btn ${classMap(this.containerClasses)}"
        aria-label="Networks"
        @click=${this.handleClick}
        @keydown=${this.handleKeydown}
      >
        ${visible.map(
          (network, index) => html`
            <div
              class="${index > 0 ? "-ml-4" : ""} relative"
              style="z-index: ${index}"
            >
              <ledger-crypto-icon
                .ledgerId=${network.id}
                .ticker=${network.ticker ?? ""}
                size="small"
                variant="square"
                ?stacked=${index > 0}
              ></ledger-crypto-icon>
            </div>
          `,
        )}
        ${overflowCount > 0
          ? html`<span class="${overflowVariants()} ml-4"
              >+${overflowCount}</span
            >`
          : nothing}
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
