import "../../components/index";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Subscription } from "rxjs";

import PACKAGE from "../../../package.json" with { type: "json" };
import { CoreContext, coreContext } from "../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context";
import { Navigation } from "../../shared/navigation";
import { Destinations } from "../../shared/routes";
import { tailwindElement } from "../../tailwind-element";

const DEVELOPER_MODE_CLICKS = 7;

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

  @state()
  private hasDeveloperMode = false;

  @state()
  private versionClickCount = 0;

  private contextSubscription?: Subscription;

  override connectedCallback(): void {
    super.connectedCallback();
    this.contextSubscription = this.coreContext
      .observeContext()
      .subscribe((context) => {
        this.hasDeveloperMode = context.hasDeveloperMode;
      });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.contextSubscription?.unsubscribe();
  }

  private handlePreferencesClick() {
    this.navigation.navigateTo(this.destinations.preferences);
  }

  private handleSecurityClick() {
    this.navigation.navigateTo(this.destinations.security);
  }

  private handleHelpSupportClick() {
    this.navigation.navigateTo(this.destinations.support);
  }

  private handleDeveloperClick() {
    this.navigation.navigateTo(this.destinations.developer);
  }

  private handleVersionClick() {
    this.versionClickCount += 1;

    if (this.versionClickCount >= DEVELOPER_MODE_CLICKS) {
      this.versionClickCount = 0;
      this.coreContext.enableDeveloperMode();
    }
  }

  private renderMenuItem(
    icon: "settingsAlt2" | "shield" | "question" | "code",
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

        <span class="body-2-semi-bold min-w-0 truncate text-base"
          >${label}</span
        >
      </div>
      <ledger-icon
        type="chevronRight"
        .size=${16}
        fillColor="currentColor"
        class="text-muted shrink-0"
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
          ${this.hasDeveloperMode
            ? this.renderMenuItem(
                "code",
                settings.developer?.title ?? "Developer",
                this.handleDeveloperClick,
              )
            : null}
        </div>
        <div class="flex w-full items-center justify-center p-24">
          <button
            type="button"
            class="body-2 text-muted min-w-0 flex-1 cursor-pointer truncate text-center select-none"
            @click=${this.handleVersionClick}
          >
            v${PACKAGE.version}
          </button>
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
