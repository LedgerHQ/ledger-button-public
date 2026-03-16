import "../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { CONTACT_US_URL, SUPPORT_URL } from "../../shared/constants";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";

@customElement("support-screen")
@tailwindElement()
export class SupportScreen extends LitElement {
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

  private handleSupportClick() {
    window.open(SUPPORT_URL, "_blank", "noopener,noreferrer");
  }

  private handleContactUsClick() {
    window.open(CONTACT_US_URL, "_blank", "noopener,noreferrer");
  }

  private renderSupportItem(
    icon: "headphone" | "envelope",
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
          type="externalLink"
          size="small"
          fillColor="currentColor"
          class="text-muted"
        ></ledger-icon>
      </button>
    `;
  }

  override render() {
    const translations = this.languages.currentTranslation;
    const support = translations.settings?.support;

    const supportLabel = support?.support ?? "Support";
    const contactUsLabel = support?.contactUs ?? "Contact us";

    return html`
      <div class="flex flex-col gap-12 p-24 pt-8">
        ${this.renderSupportItem(
          "headphone",
          supportLabel,
          this.handleSupportClick,
        )}
        ${this.renderSupportItem(
          "envelope",
          contactUsLabel,
          this.handleContactUsClick,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "support-screen": SupportScreen;
  }
}
