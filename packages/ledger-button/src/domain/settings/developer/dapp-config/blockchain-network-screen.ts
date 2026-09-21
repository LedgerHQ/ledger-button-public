import "../../../../components/index";

import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../../context/core-context";
import { Navigation } from "../../../../shared/navigation";
import { Destinations } from "../../../../shared/routes";
import { tailwindElement } from "../../../../tailwind-element";
import { BlockchainNetworkController } from "./blockchain-network-controller";

@customElement("blockchain-network-screen")
@tailwindElement()
export class BlockchainNetworkScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext, subscribe: true })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @state() private _overridesVersion = 0;

  private controller?: BlockchainNetworkController;

  override willUpdate(changedProps: PropertyValues) {
    if (
      (changedProps.has("navigation") || changedProps.has("coreContext")) &&
      this.navigation &&
      this.coreContext &&
      !this.controller
    ) {
      this.controller = new BlockchainNetworkController(
        this,
        this.coreContext,
        this.navigation,
        this.destinations,
        () => {
          this._overridesVersion++;
        },
      );
    }
  }

  private renderNetworkItem(network: BlockchainNetwork) {
    return html`
      <div
        class="flex h-64 w-full shrink-0 items-center gap-16 px-8 py-0"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <span class="body-2-semi-bold truncate text-base">
            ${network.currencyName}
          </span>
          <span class="body-3 text-muted truncate">
            ${network.currencyTicker}
          </span>
        </div>
        <span
          class="body-3 bg-muted text-muted shrink-0 rounded-sm px-8 py-4"
        >
          ${network.id}
        </span>
      </div>
    `;
  }

  override render() {
    const controller = this.controller;

    if (!controller) {
      return html`<div class="flex flex-col px-16"></div>`;
    }

    return html`
      <div class="relative flex h-full flex-col">
        <div class="flex flex-1 flex-col overflow-y-auto px-16 py-0">
          ${controller.networks.map((n) => this.renderNetworkItem(n))}
        </div>

        <div class="flex flex-col gap-12 px-16 pb-24 pt-0">
          ${controller.hasOverrides
            ? html`<ledger-button
                size="full"
                variant="secondary"
                label="Reset configuration"
                @click=${() => controller.resetOverrides()}
              ></ledger-button>`
            : ""}
          <ledger-button
            size="full"
            variant="primary"
            .icon=${true}
            iconType="plus"
            label="Add network"
            @click=${() => controller.navigateToAddNetwork()}
          ></ledger-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "blockchain-network-screen": BlockchainNetworkScreen;
  }
}
