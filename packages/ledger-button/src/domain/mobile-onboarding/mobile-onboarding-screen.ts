import "../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import { MobileOnboardingController } from "./mobile-onboarding-controller.js";

@customElement("mobile-onboarding-screen")
@tailwindElement()
export class MobileOnboardingScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: MobileOnboardingController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new MobileOnboardingController(this);
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const mobileOnboarding = translations.mobileOnboarding;

    if (!mobileOnboarding) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    return html`
      <ledger-drawer @drawer-close=${() => this.controller.handleReject()}>
        <div class="flex flex-col items-center gap-32 text-center">
          <div
            class="flex h-64 w-64 items-center justify-center rounded-full bg-muted-transparent"
          >
            <ledger-icon
              type="info"
              size="large"
              fillColor="white"
            ></ledger-icon>
          </div>

          <div class="flex flex-col gap-12">
            <h3 class="font-semibold text-base heading-4">
              ${mobileOnboarding.title}
            </h3>
            <p class="text-muted opacity-60 body-1">
              ${mobileOnboarding.description}
            </p>
          </div>

          <div class="flex w-full flex-col gap-12">
            <ledger-button
              variant="primary"
              size="full"
              label=${mobileOnboarding.allowButton}
              @click=${() => this.controller.handleAllow()}
            ></ledger-button>
            <ledger-button
              variant="secondary"
              size="full"
              label=${mobileOnboarding.rejectButton}
              @click=${() => this.controller.handleReject()}
            ></ledger-button>
          </div>
        </div>
      </ledger-drawer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mobile-onboarding-screen": MobileOnboardingScreen;
  }
}
