import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

export interface LedgerToggleAttributes {
  checked: boolean;
  disabled: boolean;
}

const styles = css`
  .toggle-track {
    width: 52px;
    height: 32px;
  }

  .toggle-thumb {
    width: 24px;
    height: 24px;
    top: 4px;
  }

  .toggle-thumb.checked {
    transform: translateX(24px);
  }

  .toggle-thumb:not(.checked) {
    transform: translateX(4px);
  }
`;

@customElement("ledger-toggle")
@tailwindElement(styles)
export class LedgerToggle extends LitElement {
  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  private handleClick() {
    if (this.disabled) {
      return;
    }

    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent("ledger-toggle-change", {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      }),
    );
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.handleClick();
    }
  }

  override render() {
    const trackClasses = {
      "toggle-track rounded-full relative cursor-pointer transition-colors duration-200 ease-in-out":
        true,
      "bg-accent": this.checked,
      "bg-muted-pressed": !this.checked,
      "opacity-50 cursor-not-allowed": this.disabled,
    };

    const thumbClasses = {
      "toggle-thumb rounded-full bg-white absolute transition-transform duration-200 ease-in-out":
        true,
      checked: this.checked,
    };

    return html`
      <div
        class=${classMap(trackClasses)}
        role="switch"
        aria-checked=${this.checked}
        aria-disabled=${this.disabled}
        tabindex=${this.disabled ? -1 : 0}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
      >
        <div class=${classMap(thumbClasses)}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-toggle": LedgerToggle;
  }

  interface WindowEventMap {
    "ledger-toggle-change": CustomEvent<{ checked: boolean }>;
  }
}

export default LedgerToggle;
