import "../../components/index.js";
import "../../components/atom/toggle/ledger-toggle.js";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { tailwindElement } from "../../tailwind-element.js";

@customElement("security-screen")
@tailwindElement()
export class SecurityScreen extends LitElement {
  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @state()
  private analyticsEnabled = false;

  override async connectedCallback() {
    super.connectedCallback();
    this.analyticsEnabled = await this.coreContext.hasConsent();
  }

  private async handleToggleChange(e: CustomEvent) {
    const { checked } = e.detail;

    if (checked) {
      await this.coreContext.giveConsent();
    } else {
      await this.coreContext.removeConsent();
    }

    this.analyticsEnabled = checked;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const settings = translations.settings;

    if (!settings) {
      return html`<div>Loading...</div>`;
    }

    return html`
      <div class="flex flex-col p-24 pt-8">
        <div class="rounded-md bg-muted p-16">
          <div class="flex flex-row items-center justify-between">
            <h3 class="text-base body-3-semi-bold">
              ${settings.analytics.title}
            </h3>
            <ledger-toggle
              .checked=${this.analyticsEnabled}
              @ledger-toggle-change=${this.handleToggleChange}
            ></ledger-toggle>
          </div>

          <p class="leading-relaxed mt-16 text-muted body-3">
            ${settings.analytics.description}
          </p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "security-screen": SecurityScreen;
  }
}
