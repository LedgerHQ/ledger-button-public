import "../../../components/index";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context";
import { Navigation } from "../../../shared/navigation";
import { Destinations } from "../../../shared/routes";
import { tailwindElement } from "../../../tailwind-element";
import { MobileOnboardingController } from "./mobile-onboarding-controller";

@customElement("mobile-onboarding-screen")
@tailwindElement()
export class MobileOnboardingScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: MobileOnboardingController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new MobileOnboardingController(
      this,
      this.coreContext,
      this.languages,
    );
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const mobileOnboarding = translations.mobileOnboarding;

    if (!mobileOnboarding) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    return html`
      <div class="flex flex-col items-center gap-12 p-24 pt-0 text-center">
        <div
          class="bg-muted-transparent flex h-64 w-64 items-center justify-center rounded-full"
        >
          <ledger-icon type="info" .size=${32} fillColor="white"></ledger-icon>
        </div>

        <div class="flex flex-col gap-12">
          <h3 class="heading-4 text-base font-semibold">
            ${mobileOnboarding.title}
          </h3>
          <p class="text-muted body-1 opacity-60">
            ${mobileOnboarding.description}
          </p>
        </div>

        <div class="flex w-full flex-col gap-12">
          <ledger-button
            variant="primary"
            size="full"
            label=${mobileOnboarding.allowButton}
            href=${this.controller.ledgerWalletUrl}
            target="_blank"
            @ledger-button-click=${() => this.controller.trackRedirectToLedgerWallet()}
          ></ledger-button>
          <ledger-button
            variant="secondary"
            size="full"
            label=${mobileOnboarding.rejectButton}
            @click=${() => this.controller.downloadLedgerWallet()}
          ></ledger-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mobile-onboarding-screen": MobileOnboardingScreen;
  }
}
