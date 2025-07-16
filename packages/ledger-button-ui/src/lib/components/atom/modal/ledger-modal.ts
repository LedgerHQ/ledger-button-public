import "../../molecule/toolbar/ledger-toolbar";

import { css, html, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import tailwindStyles from "../../../../styles.css?inline";

export interface LedgerModalAttributes {
  title: string;
  isOpen?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

type CustomEventData = {
  timestamp: number;
};

@customElement("ledger-modal")
export class LedgerModal extends LitElement {
  @property({ type: Boolean, attribute: "is-open", reflect: true })
  isOpen = false;

  @property({ type: Boolean, attribute: false })
  isClosing = false;

  @property({ type: String })
  override title = "";

  @query(".modal-overlay")
  private overlayElement!: HTMLElement;

  @query("ledger-toolbar")
  private toolbarElement!: HTMLElement;

  private focusableElements: HTMLElement[] = [];
  private previousBodyOverflow = "";

  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      :host {
        display: none;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1000;
      }
      :host([isOpen]) {
        display: flex;
      }
      .modal-overlay {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
        opacity: 0;
      }
    `,
  ];

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setupEventListeners();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanupEventListeners();
  }

  override updated(changedProperties: Map) {
    super.updated(changedProperties);

    if (changedProperties.has("isOpen")) {
      if (this.isClosing) {
        return;
      }

      if (this.isOpen) {
        this.dispatchEvent(
          new CustomEvent<CustomEventData>("modal-opened", {
            bubbles: true,
            composed: true,
            detail: {
              timestamp: Date.now(),
            },
          }),
        );
        return;
      }
    }

    if (changedProperties.has("isClosing")) {
      if (this.isClosing) {
        this.dispatchEvent(
          new CustomEvent<CustomEventData>("modal-closed", {
            bubbles: true,
            composed: true,
            detail: {
              timestamp: Date.now(),
            },
          }),
        );
        return;
      }
    }
  }

  private setupEventListeners() {
    document.addEventListener("keydown", this.handleKeydown);
    this.addEventListener("modal-opened", this.handleOpen);
    this.addEventListener("modal-closed", this.handleClose);
  }

  private cleanupEventListeners() {
    document.removeEventListener("keydown", this.handleKeydown);
    this.removeEventListener("modal-opened", this.handleOpen);
    this.removeEventListener("modal-closed", this.handleClose);
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
      }),
    );
  }

  private handleClose() {
    dispatchEvent(
      new CustomEvent("model-closed", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          isOpen: this.isOpen,
        },
      }),
    );
  }

  private focusFirstElement() {
    if (this.toolbarElement) {
      this.toolbarElement.focus();
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

  private handleToolbarClose = () => {
    document.body.style.overflow = this.previousBodyOverflow;
    this.closeModal();
  };

  public openModal() {
    this.isOpen = true;
  }

  public closeModal() {
    this.isOpen = false;
  }

  override render() {
    return html`
      <div
        class="modal-overlay w-screen h-screen relative z-10 justify-center bg-canvas-overlay"
        @click=${this.handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby=${this.title ? "modal-title" : ""}
        aria-describedby="modal-content"
        data-testid="modal-overlay"
      >
        <div
          class="w-screen h-448 fixed inset-0 z-10 flex w-384 flex-col self-center justify-self-center overflow-y-auto rounded-xl bg-black"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <ledger-toolbar
            .title=${this.title}
            show-logo
            show-close
            @toolbar-close=${this.handleToolbarClose}
            aria-label=${this.title || ""}
          ></ledger-toolbar>
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
    "ledger-modal": LedgerModal;
  }
}

export default LedgerModal;
