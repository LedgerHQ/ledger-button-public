import "../../../components/index.js";

import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { tailwindElement } from "../../../tailwind-element.js";

/** How long the success screen stays visible before auto-closing. */
const AUTO_CLOSE_DELAY_MS = 1500;

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

  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  override firstUpdated(): void {
    this.scheduleAutoClose();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cancelAutoClose();
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
          primary-button-label=""
          secondary-button-label=""
        ></ledger-status>
      </div>
    `;
  }

  private scheduleAutoClose(): void {
    this.cancelAutoClose();
    this.autoCloseTimer = setTimeout(() => {
      this.autoCloseTimer = null;
      this.navigation.host.closeModal({ morph: true });
    }, AUTO_CLOSE_DELAY_MS);
  }

  private cancelAutoClose(): void {
    if (this.autoCloseTimer !== null) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "connection-success-screen": ConnectionSuccessScreen;
  }
}
