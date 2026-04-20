import "../../../components/index.js";

import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { RootNavigationComponent } from "../../../shared/root-navigation.js";
import { tailwindElement } from "../../../tailwind-element.js";

@customElement("connection-success-screen")
@tailwindElement()
export class ConnectionSuccessScreen extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;

  @property({ type: Object })
  navigation!: Navigation;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private handleStatusAction() {
    if (this.navigation.host instanceof RootNavigationComponent) {
      this.navigation.host.closeModalWithMorph();
    }
  }

  override render() {
    const translations = this.languages.currentTranslation;

    return html`
      <div
        class="flex min-h-0 flex-col items-stretch justify-center self-stretch p-24 pt-0"
      >
        <ledger-status
          type="success"
          title=${translations.onboarding.connectionSuccess.title}
          primary-button-label=${translations.onboarding.connectionSuccess
            .close}
          secondary-button-label=""
          @status-action=${this.handleStatusAction}
        ></ledger-status>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "connection-success-screen": ConnectionSuccessScreen;
  }
}
