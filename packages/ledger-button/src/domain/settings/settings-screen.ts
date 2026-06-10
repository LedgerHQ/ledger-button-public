import "../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import PACKAGE from "../../../package.json" with { type: "json" };

@customElement("settings-screen")
@tailwindElement()
export class SettingsScreen extends LitElement {
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

  private handlePreferencesClick() {
    this.navigation.navigateTo(this.destinations.preferences);
  }

  private handleSecurityClick() {
    this.navigation.navigateTo(this.destinations.security);
  }

  private handleHelpSupportClick() {
    this.navigation.navigateTo(this.destinations.support);
  }

  private renderMenuItem(
    icon: "settingsAlt2" | "shield" | "question",
    label: string,
    onClick?: () => void,
  ) {
    const row = html`
      <div class="flex min-w-0 flex-1 items-center gap-12">
        <ledger-icon
          type=${icon}
          .size=${24}
          fillColor="currentColor"
        ></ledger-icon>

        <span class="body-2-semi-bold min-w-0 truncate text-base">${label}</span>
      </div>
      <ledger-icon
        type="chevronRight"
        .size=${16}
        fillColor="currentColor"
        class="shrink-0 text-muted"
      ></ledger-icon>
    `;

    if (onClick) {
      return html`
        <button
          class="bg-base-transparent hover:bg-base-transparent-hover flex h-64 min-w-full cursor-pointer items-center gap-16 rounded-md px-8 py-0 transition duration-150 ease-in-out"
          @click=${onClick}
        >
          ${row}
        </button>
      `;
    }

    return html`
      <div
        class="bg-base-transparent flex h-64 min-w-full cursor-default items-center gap-16 rounded-md px-8 py-0 opacity-60"
      >
        ${row}
      </div>
    `;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const settings = translations.settings;

    if (!settings) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    return html`
      <div class="flex h-full flex-col">
        <div class="flex flex-1 flex-col items-start px-16 py-0">
          ${this.renderMenuItem(
            "settingsAlt2",
            settings.preferences?.title ?? "Preferences",
            this.handlePreferencesClick,
          )}
          ${this.renderMenuItem(
            "shield",
            settings.securityConfidentiality?.title ??
              "Security & confidentiality",
            this.handleSecurityClick,
          )}
          ${this.renderMenuItem(
            "question",
            settings.support?.title ?? "Help & Support",
            this.handleHelpSupportClick,
          )}
        </div>
        <div class="flex w-full items-center justify-center p-24">
          <span class="body-2 min-w-0 flex-1 truncate text-center text-muted">
            v${PACKAGE.version}
          </span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-screen": SettingsScreen;
  }
}
