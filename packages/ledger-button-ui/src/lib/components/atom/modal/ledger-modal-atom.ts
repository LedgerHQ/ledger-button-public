import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import tailwindStyles from "../../../../styles.css?inline";

export interface LedgerModalAtomAttributes {
  title: string;
  isOpen?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

@customElement("ledger-modal-atom")
export class LedgerModalAtom extends LitElement {
  @property({ type: Boolean, attribute: "is-open", reflect: true })
  isOpen = false;

  @property({ type: String })
  override title = "";

  @query(".modal-overlay")
  private overlayElement!: HTMLElement;

  @query(".close-button")
  private closeButtonElement!: HTMLButtonElement;

  private focusableElements: HTMLElement[] = [];
  private previousBodyOverflow = "";

  static override styles = [unsafeCSS(tailwindStyles)];

  override connectedCallback() {
    super.connectedCallback();
    this.setupEventListeners();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanupEventListeners();
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has("isOpen")) {
      if (this.isOpen) {
        this.handleOpen();
        return;
      }

      this.handleClose();
    }
  }

  private setupEventListeners() {
    document.addEventListener("keydown", this.handleKeydown);
  }

  private cleanupEventListeners() {
    document.removeEventListener("keydown", this.handleKeydown);
  }

  private handleKeydown = (event: KeyboardEvent) => {
    if (!this.isOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.closeModal();
    }
  };

  private handleOpen() {
    this.focusFirstElement();

    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    dispatchEvent(
      new CustomEvent("model-opened", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          isOpen: this.isOpen,
        },
      })
    );
  }

  private handleClose() {
    document.body.style.overflow = this.previousBodyOverflow;

    dispatchEvent(
      new CustomEvent("model-closed", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          isOpen: this.isOpen,
        },
      })
    );
  }

  private focusFirstElement() {
    if (this.closeButtonElement) {
      this.closeButtonElement.focus();
      return;
    }

    const [firstFocusableElement] = this.focusableElements;

    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
  }

  private handleOverlayClick = (event: MouseEvent) => {
    if (event.target === this.overlayElement) {
      this.closeModal();
    }
  };

  private handleCloseClick = () => {
    this.closeModal();
  };

  public openModal() {
    this.isOpen = true;
  }

  public closeModal() {
    this.isOpen = false;
  }

  private renderLedgerIcon() {
    return html`
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_149_5244)">
          <g clip-path="url(#clip1_149_5244)">
            <path
              d="M0.00195312 0V3.95062H0.878831V0.875929H6.02024V0H0.00195312ZM9.98367 0V0.875929H15.1251V3.95062H16.002V0H9.98367Z"
              fill="white"
            />
            <path
              d="M15.999 16L15.999 12.0494L15.1221 12.0494L15.1221 15.1241L9.98074 15.1241L9.98074 16L15.999 16ZM6.01731 16L6.01731 15.1241L0.8759 15.1241L0.875901 12.0494L-0.000976217 12.0494L-0.000976562 16L6.01731 16Z"
              fill="white"
            />
            <path
              d="M6.2207 10.6973V5.23486H7.0166V9.97945H9.81017V10.6973H6.2207Z"
              fill="white"
            />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_149_5244">
            <rect width="16" height="16" fill="white" />
          </clipPath>
          <clipPath id="clip1_149_5244">
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
    `;
  }

  private renderCloseIcon() {
    return html`
      <svg
        width="20"
        height="20"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.33301 1.33325L10.6663 10.6666L1.33301 1.33325Z"
          fill="#949494"
        />
        <path
          d="M10.6663 1.33325L1.33301 10.6666L10.6663 1.33325Z"
          fill="#949494"
        />
        <path
          d="M1.33301 1.33325L10.6663 10.6666M10.6663 1.33325L1.33301 10.6666"
          stroke="#949494"
          stroke-width="1.3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  override render() {
    if (!this.isOpen) {
      return html``;
    }

    return html`
      <div
        class="modal-overlay relative z-10"
        @click=${this.handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby=${this.title ? "modal-title" : ""}
        aria-describedby="modal-content"
        data-testid="modal-overlay"
      >
        <div
          class="fixed inset-0 bg-background-canvas-overlay"
          aria-hidden="true"
        ></div>
        <div
          class="fixed inset-0 z-10 w-screen overflow-y-auto bg-black w-400 h-448 flex flex-col rounded-xl"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <div
            class="relative transform overflow-hidden flex justify-between p-16"
          >
            <div class="w-20 h-20">${this.renderLedgerIcon()}</div>
            ${this.title
              ? html`<h2
                  id="modal-title"
                  class="text-xl font-inter font-semibold text-white"
                >
                  ${this.title}
                </h2>`
              : ""}
            <button
              class="w-20 h-20"
              @click=${this.handleCloseClick}
              aria-label="Close modal"
              data-testid="close-button"
            >
              ${this.renderCloseIcon()}
            </button>
          </div>
          <div id="modal-content" class="p-16 text-white">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-modal-atom": LedgerModalAtom;
  }
}

export default LedgerModalAtom;
