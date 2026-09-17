import "../../../../components/index";

import { consume } from "@lit/context";
import { html, LitElement, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../../context/core-context";
import { Navigation } from "../../../../shared/navigation";
import { Destinations } from "../../../../shared/routes";
import { tailwindElement } from "../../../../tailwind-element";
import { AddNetworkController } from "./add-network-controller";
import type { BlockchainNetworkScreenData } from "./blockchain-network-controller";

const INPUT_CLASS =
  "body-2-medium h-48 w-full rounded-sm bg-muted px-16 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-base";

@customElement("add-network-screen")
@tailwindElement()
export class AddNetworkScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @property({ type: Object })
  screenData?: BlockchainNetworkScreenData;

  @consume({ context: coreContext, subscribe: true })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @state() private networkId = "";
  @state() private currencyName = "";
  @state() private currencyId = "";
  @state() private currencyTicker = "";

  @query("#network-id-input")
  private networkIdInput!: HTMLInputElement;

  private controller?: AddNetworkController;

  override willUpdate(changedProps: PropertyValues) {
    if (
      (changedProps.has("navigation") ||
        changedProps.has("screenData") ||
        changedProps.has("coreContext")) &&
      this.navigation &&
      this.coreContext &&
      !this.controller &&
      this.screenData
    ) {
      this.controller = new AddNetworkController(
        this,
        this.coreContext,
        this.navigation,
        this.screenData.blockchainId,
      );
    }
  }

  override firstUpdated() {
    this.networkIdInput?.focus();
  }

  private get canAdd(): boolean {
    return (
      this.networkId.trim().length > 0 &&
      this.currencyName.trim().length > 0 &&
      this.currencyId.trim().length > 0 &&
      this.currencyTicker.trim().length > 0
    );
  }

  private handleAdd(controller: AddNetworkController) {
    if (!this.canAdd) return;
    controller.addNetwork({
      id: this.networkId.trim(),
      currencyName: this.currencyName.trim(),
      currencyId: this.currencyId.trim(),
      currencyTicker: this.currencyTicker.trim(),
    });
  }

  private renderInput(
    id: string,
    placeholder: string,
    value: string,
    onInput: (v: string) => void,
    onEnter: () => void,
  ) {
    return html`
      <input
        id=${id}
        class=${INPUT_CLASS}
        type="text"
        .value=${value}
        placeholder=${placeholder}
        aria-label=${placeholder}
        @input=${(e: Event) => onInput((e.target as HTMLInputElement).value)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter") onEnter();
        }}
      />
    `;
  }

  override render() {
    const controller = this.controller;

    if (!controller) {
      return html`<div class="flex flex-col px-16"></div>`;
    }

    const handleEnter = () => this.handleAdd(controller);

    return html`
      <div class="relative flex h-full flex-col">
        <div class="flex flex-col gap-16 px-16 py-0">
          ${this.renderInput(
            "network-id-input",
            "ID",
            this.networkId,
            (v) => (this.networkId = v),
            handleEnter,
          )}
          ${this.renderInput(
            "currency-name-input",
            "Currency Name",
            this.currencyName,
            (v) => (this.currencyName = v),
            handleEnter,
          )}
          ${this.renderInput(
            "currency-id-input",
            "Currency ID",
            this.currencyId,
            (v) => (this.currencyId = v),
            handleEnter,
          )}
          ${this.renderInput(
            "currency-ticker-input",
            "Currency Ticker",
            this.currencyTicker,
            (v) => (this.currencyTicker = v),
            handleEnter,
          )}
        </div>

        <div
          class="from-base-transparent to-base absolute right-0 bottom-0 left-0 flex flex-col gap-16 bg-gradient-to-b px-16 pt-48 pb-24"
        >
          <ledger-button
            size="full"
            variant="primary"
            label="Add network"
            ?disabled=${!this.canAdd}
            @click=${() => this.handleAdd(controller)}
          ></ledger-button>
          <ledger-button
            size="full"
            variant="secondary"
            label="Cancel"
            @click=${() => controller.cancel()}
          ></ledger-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "add-network-screen": AddNetworkScreen;
  }
}
