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

@customElement("developer-screen")
@tailwindElement()
export class DeveloperScreen extends LitElement {
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

  private handleFeatureFlagsClick() {
    this.navigation.navigateTo(this.destinations.featureFlags);
  }

  private renderMenuItem(
    icon: "featureFlags",
    label: string,
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
      </button>
    `;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const settings = translations.settings;

    if (!settings) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    return html`
      <div class="flex flex-col px-16 py-0">
        ${this.renderMenuItem(
          "featureFlags",
          settings.featureFlags?.title ?? "Feature flags",
          this.handleFeatureFlagsClick,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "developer-screen": DeveloperScreen;
  }
}
