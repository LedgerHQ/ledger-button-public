import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";
import { tailwindElement } from "../../../tailwind-element.js";
import qrLedgerSync from "./qr-ledger-sync.png";
import { TurnOnSyncMobileController } from "./turn-on-sync-mobile-controller.js";

@customElement("turn-on-sync-mobile-screen")
@tailwindElement()
export class TurnOnSyncMobileScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  controller!: TurnOnSyncMobileController;

  override connectedCallback() {
    super.connectedCallback();

    this.controller = new TurnOnSyncMobileController(
      this,
      this.navigation,
      this.destinations,
    );
  }

  private handleLedgerSyncActivated() {
    this.controller.handleLedgerSyncActivated();
  }

  override render() {
    const lang = this.languageContext.currentTranslation;
    return html`
      <div class="flex flex-col gap-40 p-24 pt-0">
        <div class="flex flex-col gap-24">
          <div class="flex flex-row gap-4">
            <p class="text-base body-2">1.</p>
            <p class="text-base body-2">
              ${lang.ledgerSync.activateStep1Mobile}
            </p>
          </div>
          <div
            class="flex flex-row items-center justify-center gap-16"
          >
            <img
              class="w-full max-w-176"
              src=${qrLedgerSync}
              alt="https://go.ledger.com/ledger/ledgersync"
            />
          </div>
        </div>
        <div class="flex flex-col gap-24">
          <div class="flex flex-row gap-4">
            <p class="text-base body-2">2.</p>
            <p class="text-base body-2">
              ${lang.ledgerSync.activateStep2}
            </p>
          </div>
          <ledger-button
            variant="primary"
            size="full"
            .label=${lang.ledgerSync.activated}
            @click=${this.handleLedgerSyncActivated}
          ></ledger-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "turn-on-sync-mobile-screen": TurnOnSyncMobileScreen;
  }
}
