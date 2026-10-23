import "../../components/index";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  langContext,
  LanguageContext,
} from "../../context/language-context";
import { SANCTIONS_COMPLIANCE_URL } from "../../shared/constants/support-urls";
import { tailwindElement } from "../../tailwind-element";

@customElement("geo-block-screen")
@tailwindElement()
export class GeoBlockScreen extends LitElement {
  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private handleLearnMore() {
    window.open(SANCTIONS_COMPLIANCE_URL, "_blank", "noopener,noreferrer");
  }

  override render() {
    const geoBlock = this.languages.currentTranslation.geoBlock;

    return html`
      <div class="flex flex-col gap-12 p-24 pt-0">
        <ledger-status
          type="error"
          title=${geoBlock.title}
          description=${geoBlock.description}
          primary-button-label=${geoBlock.learnMore}
          secondary-button-label=""
          @status-action=${this.handleLearnMore}
        ></ledger-status>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "geo-block-screen": GeoBlockScreen;
  }
}
