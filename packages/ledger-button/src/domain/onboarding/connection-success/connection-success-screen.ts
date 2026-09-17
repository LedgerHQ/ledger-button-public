import "../../../components/index";

import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  langContext,
  LanguageContext,
} from "../../../context/language-context";
import { Navigation } from "../../../shared/navigation";
import { tailwindElement } from "../../../tailwind-element";

@customElement("connection-success-screen")
@tailwindElement()
export class ConnectionSuccessScreen extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: min(400px, calc(100vh - 64px));
    }
  `;

  @property({ type: Object })
  navigation!: Navigation;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  override connectedCallback(): void {
    super.connectedCallback();
    this.dispatchEvent(
      new CustomEvent("ledger-status-show", {
        bubbles: true,
        composed: true,
        detail: { type: "success" },
      }),
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.dispatchEvent(
      new CustomEvent("ledger-status-hide", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const translations = this.languages.currentTranslation;

    return html`
      <div class="flex h-full flex-col gap-32 p-24">
        <div class="flex flex-1 flex-col items-center justify-center gap-24">
          <div
            class="bg-muted-transparent text-success flex h-72 w-72 items-center justify-center rounded-full p-12"
          >
            <ledger-icon
              type="checkMarkCircleFill"
              size="40"
              fillColor="currentColor"
            ></ledger-icon>
          </div>
          <div class="flex w-full flex-col gap-8 text-center">
            <h2 class="heading-3-semi-bold text-base">
              ${translations.onboarding.connectionSuccess.title}
            </h2>
            <p class="text-muted body-2">
              ${translations.onboarding.connectionSuccess.subtitle}
            </p>
          </div>
        </div>
        <ledger-button
          variant="primary"
          size="full"
          .label=${translations.onboarding.connectionSuccess.close}
          @click=${this.handleClose}
        ></ledger-button>
      </div>
    `;
  }

  private handleClose(): void {
    this.navigation.host.closeModal({ morph: true });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "connection-success-screen": ConnectionSuccessScreen;
  }
}
