import "../../../components/index.js";

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

@customElement("consent-analytics-screen")
@tailwindElement()
export class ConsentAnalyticsScreen extends LitElement {
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

  //TODO put this in a controller
  private async handleAccept() {
    await this.coreContext.giveConsent();
  }

  private async handleRefuse() {
    await this.coreContext.refuseConsent();
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const consent = translations.onboarding.consentPrompt?.consent;

    if (!consent) {
      return html`<div>Loading...</div>`;
    }

    return html`
      <div class="flex flex-col gap-24 p-24 pt-8">
        <div class="rounded-md bg-muted p-12">
          <p class="leading-relaxed text-muted body-2">
            ${consent.description}
          </p>
          <p class="leading-relaxed mt-12 text-muted body-2">
            ${consent.privacyNotice}
            <a
              href="https://www.ledger.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              class="underline"
              >${consent.privacyPolicyLink}</a
            >.
          </p>
        </div>

        <div class="grid gap-12" style="grid-template-columns: 1fr 1fr;">
          <ledger-button
            variant="secondary"
            size="full"
            .label=${consent.rejectButton}
            @click=${this.handleRefuse}
          ></ledger-button>

          <ledger-button
            variant="primary"
            size="full"
            .label=${consent.acceptButton}
            @click=${this.handleAccept}
          ></ledger-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "consent-analytics-screen": ConsentAnalyticsScreen;
  }
}
