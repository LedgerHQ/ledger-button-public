import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { type StatusType } from "../../../components/index.js";
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
import { tailwindElement } from "../../../tailwind-element.js";
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
      this.languages,
    );
  }

  handleStatusAction = (
    e: CustomEvent<{
      timestamp: number;
      action: "primary" | "secondary";
      type: StatusType;
    }>,
  ) => {
    const actionMapper = {
      primary: () => {
        this.controller.errorData?.cta1?.action();
      },
      secondary: () => {
        this.controller.errorData?.cta2?.action();
      },
    };

    actionMapper[e.detail.action]?.();
  };

  renderNormalScreen() {
    const { animation } = this.controller;
    const lang = this.languages.currentTranslation;

    return html`
      <div
        class="min-h-200 flex flex-col items-center justify-center gap-24 self-stretch px-24 pb-48"
      >
        <div class="w-208">
          <ledger-device-animation
            modelId="flex"
            animation=${animation}
          ></ledger-device-animation>
        </div>
        <div class="flex flex-col items-center gap-8 self-stretch">
          <p class="text-center body-1">
            ${lang.common.device.deviceActions.continueOnLedger.title}
            ${lang.common.device.model["flex"]}
          </p>
          <p class="text-center text-muted body-2">
            ${lang.common.device.deviceActions.continueOnLedger.description}
          </p>
        </div>
      </div>
    `;
  }

  renderErrorScreen() {
    if (!this.controller.errorData) {
      return html``;
    }

    return html`
      <div class="flex flex-col gap-12 p-24 pt-0">
        <ledger-status
          type="error"
          title=${this.controller.errorData?.title}
          description=${this.controller.errorData?.message}
          primary-button-label=${this.controller.errorData?.cta1?.label ?? ""}
          secondary-button-label=${this.controller.errorData?.cta2?.label ?? ""}
          @status-action=${this.handleStatusAction}
        ></ledger-status>
      </div>
    `;
  }

  override render() {
    return html`
      <div class="flex flex-col">
        ${this.controller.errorData
          ? this.renderErrorScreen()
          : this.renderNormalScreen()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-sync-screen": LedgerSyncScreen;
  }
}
