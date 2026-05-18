import "../../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { getLanguageDisplayName } from "../../../context/utils/language-utils.js";
import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";
import { tailwindElement } from "../../../tailwind-element.js";
import { PreferencesController } from "./preferences-controller.js";

@customElement("preferences-screen")
@tailwindElement()
export class PreferencesScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext, subscribe: true })
  @property({ attribute: false })
  public core!: CoreContext;

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private preferencesController!: PreferencesController;

  override willUpdate(changedProps: PropertyValues) {
    if (changedProps.has("core") && this.core && !this.preferencesController) {
      this.preferencesController = new PreferencesController(this, this.core);
    }
  }

  private handleLanguageClick() {
    this.navigation.navigateTo(this.destinations.preferenceLanguage);
  }

  private handleCurrencyClick() {
    this.navigation.navigateTo(this.destinations.preferenceCurrency);
  }

  private renderMenuItem(
    icon: "dollar" | "language",
    label: string,
    currentValue: string,
    onClick: () => void,
  ) {
    return html`
      <button
        class="bg-base-transparent hover:bg-base-transparent-hover flex h-64 min-w-full cursor-pointer items-center gap-16 rounded-md px-8 py-0 transition duration-150 ease-in-out"
        @click=${onClick}
      >
        <div class="flex min-w-0 flex-1 items-center gap-12">
          <ledger-icon
            type=${icon}
            .size=${24}
            fillColor="currentColor"
          ></ledger-icon>

          <div class="flex flex-col gap-4 text-left">
            <span class="body-2-semi-bold min-w-0 truncate text-base"
              >${label}</span
            >
            <span class="text-muted body-3">${currentValue}</span>
          </div>
        </div>
        <ledger-icon
          type="chevronRight"
          .size=${16}
          fillColor="currentColor"
          class="text-muted shrink-0"
        ></ledger-icon>
      </button>
    `;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const currentLanguage = this.languages.currentLanguage;
    const settings = translations.settings;

    if (!settings || !this.preferencesController) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    const currentCurrency = this.preferencesController.currency;

    const preferences = settings.preferences;
    if (!preferences) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    const languageLabel = preferences.language?.title || "Language";
    const currencyLabel = preferences.currency?.title || "Currency";

    return html`
      <div class="flex flex-col items-start px-16 py-0">
        ${this.renderMenuItem(
          "language",
          languageLabel,
          getLanguageDisplayName(currentLanguage),
          this.handleLanguageClick,
        )}
        ${this.renderMenuItem(
          "dollar",
          currencyLabel,
          currentCurrency,
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
