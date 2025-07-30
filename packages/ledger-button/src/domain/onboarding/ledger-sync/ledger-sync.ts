import { tailwindElement } from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  type CoreContext,
  coreContext,
} from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";
import { LedgerSyncController } from "./ledger-sync-controller.js";

@customElement("ledger-sync-screen")
@tailwindElement()
export class LedgerSyncScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: LedgerSyncController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new LedgerSyncController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );
  }

  override render() {
    const { device } = this.controller;
    if (!device) {
      return;
    }

    const lang = this.languages.currentTranslation;

    return html`
      <div
        class="min-h-200 flex flex-col items-center justify-center gap-24 self-stretch px-24 pb-48"
      >
        <div class="w-208">
          <ledger-device-animation
            modelId=${device.modelId}
            animation="continueOnLedger"
          ></ledger-device-animation>
        </div>
        <div class="flex flex-col items-center gap-8 self-stretch">
          <p class="text-center body-1">
            ${lang.common.device.deviceActions.continueOnLedger.title}
            ${lang.common.device.model[device.modelId]}
          </p>
          <p class="text-center text-muted body-2">
            ${lang.common.device.deviceActions.continueOnLedger.description}
          </p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-sync-screen": LedgerSyncScreen;
  }
}
