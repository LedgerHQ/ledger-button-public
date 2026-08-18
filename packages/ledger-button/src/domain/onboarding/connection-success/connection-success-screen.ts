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

/** How long the success screen stays visible before auto-closing. */
const AUTO_CLOSE_DELAY_MS = 1500;

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

  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

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

  override firstUpdated(): void {
    this.scheduleAutoClose();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cancelAutoClose();
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
      <div
        class="flex h-full flex-col items-center justify-center gap-24 p-24"
      >
        <div
          class="bg-muted-transparent text-success flex h-72 w-72 items-center justify-center rounded-full"
        >
          <ledger-icon
            type="checkMarkCircleFill"
            size="40"
            fillColor="currentColor"
          ></ledger-icon>
        </div>
        <h2 class="text-base heading-3-semi-bold text-center">
          ${translations.onboarding.connectionSuccess.title}
        </h2>
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
