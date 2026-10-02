import "../../../../components/index";
import "../../../../components/atom/toggle/ledger-toggle";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../../../context/language-context";
import { Navigation } from "../../../../shared/navigation";
import { Destinations } from "../../../../shared/routes";
import { tailwindElement } from "../../../../tailwind-element";

@customElement("feature-flags-screen")
@tailwindElement()
export class FeatureFlagsScreen extends LitElement {
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
  private solanaEnabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.solanaEnabled = this.coreContext.getFeatureFlags().solana;
  }

  private handleSolanaToggleChange(e: CustomEvent) {
    const { checked } = e.detail;

    this.coreContext.setFeatureFlag("solana", checked);
    this.solanaEnabled = checked;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const featureFlags = translations.settings?.featureFlags;

    if (!featureFlags) {
      return html`<div>${translations.common?.loading}</div>`;
    }

    return html`
      <div class="flex flex-col p-24 pt-8">
        <div class="bg-muted rounded-md p-16">
          <div class="flex flex-row items-center justify-between">
            <h3 class="body-3-semi-bold text-base">
              ${featureFlags.solana?.title ?? "Solana"}
            </h3>
            <ledger-toggle
              .checked=${this.solanaEnabled}
              @ledger-toggle-change=${this.handleSolanaToggleChange}
            ></ledger-toggle>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "feature-flags-screen": FeatureFlagsScreen;
  }
}
