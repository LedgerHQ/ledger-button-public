import "../../molecule/toolbar/ledger-toolbar-molecule";

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

  @query("ledger-toolbar-molecule")
  private toolbarElement!: HTMLElement;

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
      }),
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
    this.closeModal();
  };

  public openModal() {
    this.isOpen = true;
  }

  public closeModal() {
    this.isOpen = false;
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
          <ledger-toolbar-molecule
            .title=${this.title}
            show-logo
            show-close
            @toolbar-close=${this.handleToolbarClose}
            aria-labelledby=${this.title ? "modal-title" : ""}
          ></ledger-toolbar-molecule>
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
