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

@customElement("preferences-screen")
@tailwindElement()
export class PreferencesScreen extends LitElement {
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

  private handleLanguageClick() {
    this.navigation.navigateTo(this.destinations.preferenceLanguage);
  }

  private handleCurrencyClick() {
    this.navigation.navigateTo(this.destinations.preferenceCurrency);
  }

  private renderMenuItem(
    icon: "swap" | "info",
    label: string,
    onClick: () => void,
  ) {
    return html`
      <button
        class="bg-base-transparent hover:bg-base-transparent-hover flex min-w-full cursor-pointer items-center justify-between rounded-md p-12 transition duration-150 ease-in-out"
        @click=${onClick}
      >
        <div class="flex items-center gap-12">
          <ledger-icon
            type=${icon}
            size="medium"
            fillColor="currentColor"
          ></ledger-icon>

          <span class="body-2-semi-bold text-base">${label}</span>
        </div>
        <ledger-icon
          type="chevronRight"
          size="small"
          fillColor="currentColor"
          class="text-muted"
        ></ledger-icon>
      </button>
    `;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const settings = translations.settings;

    if (!settings) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    const preferences = settings.preferences;
    if (!preferences) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    const languageLabel = preferences.language?.title || "Language";
    const currencyLabel = preferences.currency?.title || "Currency";

    return html`
      <div class="flex flex-col gap-4 p-24 pt-8">
        ${this.renderMenuItem(
          "info",
          languageLabel,
          this.handleLanguageClick,
        )}
        ${this.renderMenuItem(
          "swap",
          currencyLabel,
          this.handleCurrencyClick,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "preferences-screen": PreferencesScreen;
  }
}
