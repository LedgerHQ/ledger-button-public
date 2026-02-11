import { css, html, LitElement, nothing } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

export interface LedgerSearchInputAttributes {
  placeholder: string;
  value: string;
  disabled: boolean;
}

const styles = css`
  :host {
    display: block;
  }

  input {
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
    font: inherit;
    width: 100%;
  }

  input::placeholder {
    color: var(--text-muted, #999);
  }
`;

@customElement("ledger-search-input")
@tailwindElement(styles)
export class LedgerSearchInput extends LitElement {
  @property({ type: String })
  placeholder = "Search account";

  @property({ type: String })
  value = "";

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @query("input")
  private inputElement!: HTMLInputElement;

  private handleInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this.dispatchEvent(
      new CustomEvent("search-input-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private handleClear() {
    this.value = "";
    this.inputElement.value = "";
    this.inputElement.focus();
    this.dispatchEvent(
      new CustomEvent("search-input-clear", {
        bubbles: true,
        composed: true,
      }),
    );
    this.dispatchEvent(
      new CustomEvent("search-input-change", {
        bubbles: true,
        composed: true,
        detail: { value: "" },
      }),
    );
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (this.value) {
        e.preventDefault();
        this.handleClear();
      }
    }
  }

  public focus() {
    this.inputElement?.focus();
  }

  private renderClearButton() {
    if (!this.value) {
      return nothing;
    }

    return html`
      <button
        class="lb-flex lb-cursor-pointer lb-items-center lb-justify-center lb-rounded-full lb-border-none lb-bg-transparent lb-p-4 hover:lb-bg-muted-hover active:lb-bg-muted-pressed"
        @click=${this.handleClear}
        aria-label="Clear search"
        tabindex="-1"
      >
        <ledger-icon
          type="close"
          size="small"
          fillColor="white"
        ></ledger-icon>
      </button>
    `;
  }

  override render() {
    const containerClasses = {
      "lb-flex lb-h-48 lb-items-center lb-gap-8 lb-self-stretch lb-rounded-sm lb-px-16 lb-bg-muted lb-text-muted lb-body-1":
        true,
      "lb-opacity-50 lb-cursor-not-allowed": this.disabled,
    };

    return html`
      <div class=${classMap(containerClasses)}>
        <ledger-icon
          type="search"
          size="small"
          fillColor="white"
          class="lb-flex-shrink-0"
        ></ledger-icon>
        <input
          type="text"
          class="lb-text-base lb-body-1"
          .value=${this.value}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          aria-label=${this.placeholder}
          @input=${this.handleInput}
          @keydown=${this.handleKeyDown}
        />
        ${this.renderClearButton()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-search-input": LedgerSearchInput;
  }

  interface WindowEventMap {
    "search-input-change": CustomEvent<{ value: string }>;
    "search-input-clear": CustomEvent;
  }
}

export default LedgerSearchInput;
