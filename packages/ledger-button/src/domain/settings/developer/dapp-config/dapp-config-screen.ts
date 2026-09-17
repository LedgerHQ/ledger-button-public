import "../../../../components/index";

import { html, LitElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { Navigation } from "../../../../shared/navigation";
import { Destinations } from "../../../../shared/routes";
import { tailwindElement } from "../../../../tailwind-element";
import {
  type BlockchainItem,
  DappConfigController,
} from "./dapp-config-controller";

@customElement("dapp-config-screen")
@tailwindElement()
export class DappConfigScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  private controller?: DappConfigController;

  override willUpdate(changedProps: PropertyValues) {
    if (
      (changedProps.has("navigation") || changedProps.has("destinations")) &&
      this.navigation &&
      this.destinations &&
      !this.controller
    ) {
      this.controller = new DappConfigController(
        this,
        this.navigation,
        this.destinations,
      );
    }
  }

  private renderBlockchainItem(item: BlockchainItem, controller: DappConfigController) {
    return html`
      <button
        class="bg-base-transparent hover:bg-base-transparent-hover flex h-64 w-full cursor-pointer items-center gap-16 rounded-md px-8 py-0 transition duration-150 ease-in-out"
        @click=${() => controller.navigateToBlockchainNetworks(item)}
      >
        <span
          class="body-2-semi-bold min-w-0 flex-1 truncate text-start text-base"
        >
          ${item.displayName}
        </span>
        <ledger-icon
          type="chevronRight"
          .size=${16}
          fillColor="currentColor"
          class="text-muted shrink-0"
        ></ledger-icon>
      </button>
    `;
  }

  override render() {
    const controller = this.controller;

    if (!controller) {
      return html`<div class="flex flex-col px-16"></div>`;
    }

    return html`
      <div class="flex h-full flex-col px-16 py-0">
        ${controller.blockchains.map((item) =>
          this.renderBlockchainItem(item, controller),
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dapp-config-screen": DappConfigScreen;
  }
}
