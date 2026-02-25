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

  public override focus() {
    this.inputElement?.focus();
  }

  private renderClearButton() {
    if (!this.value) {
      return nothing;
    }

    return html`
      <button
        class="flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-4 hover:bg-muted-hover active:bg-muted-pressed"
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
      "flex h-48 items-center gap-8 self-stretch rounded-sm px-16 bg-muted text-muted body-1":
        true,
      "opacity-50 cursor-not-allowed": this.disabled,
    };

    return html`
      <div class=${classMap(containerClasses)}>
        <ledger-icon
          type="search"
          size="small"
          fillColor="white"
          class="flex-shrink-0"
        ></ledger-icon>
        <input
          type="text"
          class="text-base body-1"
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
