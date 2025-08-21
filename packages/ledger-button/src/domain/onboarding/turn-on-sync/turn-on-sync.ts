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
import banner from "./banner.png";
import { TurnOnSyncController } from "./turn-on-sync-controller.js";

@customElement("turn-on-sync-screen")
@tailwindElement()
export class TurnOnSyncScreen extends LitElement {
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

  controller!: TurnOnSyncController;

  override connectedCallback() {
    super.connectedCallback();
    console.log("Connected to turn-on-sync-screen");

    this.controller = new TurnOnSyncController(this, this.navigation);
  }

  private handleTurnOnSync() {
    this.controller.handleTurnOnSync();
  }

  private handleLearnMore() {
    this.controller.handleLearnMore();
  }

  override render() {
    console.log("Rendering turn-on-sync-screen");

    const lang = this.languageContext.currentTranslation;
    return html`
      <div class="flex flex-col gap-32 p-24 pt-0">
        <div class="flex flex-row items-center justify-center">
          <img class="w-full max-w-176" src=${banner} alt="banner" />
        </div>
        <div class="flex flex-col gap-8">
          <h4 class="text-center text-base heading-4">
            ${lang.onboarding.turnOnSync.subtitle}
          </h4>
          <p class="text-center text-muted body-2">
            ${lang.onboarding.turnOnSync.text}
          </p>
        </div>
        <div class="flex flex-col gap-16">
          <ledger-button
            variant="primary"
            size="full"
            .label=${lang.common.turnOnLedgerSync}
            @click=${this.handleTurnOnSync}
          ></ledger-button>

          <ledger-button
            variant="secondary"
            size="full"
            .label=${lang.common.learnMore}
            @click=${this.handleLearnMore}
          ></ledger-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "turn-on-sync-screen": TurnOnSyncScreen;
  }
}
