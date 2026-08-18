import "../../../components/index";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context";
import {
  CONTACT_US_URL,
  SUPPORT_URL,
} from "../../../shared/constants/support-urls";
import { Navigation } from "../../../shared/navigation";
import { Destinations } from "../../../shared/routes";
import { tailwindElement } from "../../../tailwind-element";

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

  @consume({ context: langContext, subscribe: true })
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
        class="bg-base-transparent hover:bg-base-transparent-hover flex h-64 min-w-full cursor-pointer items-center justify-between gap-16 rounded-md px-8 py-0 transition duration-150 ease-in-out"
        @click=${onClick}
      >
        <div class="flex min-w-0 flex-1 items-center gap-12">
          <ledger-icon
            type=${icon}
            .size=${24}
            fillColor="currentColor"
          ></ledger-icon>

          <span class="body-2-semi-bold text-base">${label}</span>
        </div>
        <ledger-icon
          type="externalLink"
          .size=${16}
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
      <div class="flex flex-col items-start px-16 py-0">
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
