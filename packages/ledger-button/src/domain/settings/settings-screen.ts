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

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private handleSecurityClick() {
    this.navigation.navigateTo(this.destinations.security);
  }

  private handleHelpSupportClick() {
    this.navigation.navigateTo(this.destinations.support);
  }

  private renderMenuItem(
    icon: "shield" | "question",
    label: string,
    onClick?: () => void,
  ) {
    const content = html`
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
    `;

    if (onClick) {
      return html`
        <button
          class="bg-base-transparent hover:bg-base-transparent-hover flex min-w-full cursor-pointer items-center justify-between rounded-md p-12 transition duration-150 ease-in-out"
          @click=${onClick}
        >
          ${content}
        </button>
      `;
    }

    return html`
      <div
        class="bg-base-transparent flex min-w-full cursor-default items-center justify-between rounded-md p-12 opacity-60"
      >
        ${content}
      </div>
    `;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const settings = translations.settings;

    if (!settings) {
      return html`<div>Loading...</div>`;
    }

    return html`
      <div class="flex flex-col gap-4 p-24 pt-8">
        ${this.renderMenuItem(
          "shield",
          settings.securityConfidentiality ?? "Security & confidentiality",
          this.handleSecurityClick,
        )}
        ${this.renderMenuItem(
          "question",
          settings.helpSupport ?? "Help & Support",
          this.handleHelpSupportClick,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-screen": SettingsScreen;
  }
}
