import { css, html, LitElement } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { animate } from "motion";

import { tailwindElement } from "../../../tailwind-element.js";

const styles = css`
  /* :host {
    display: none;
    width: 100%;
    height: 100%;
    position: absolute;
    overflow: hidden;
    top: 0;
    left: 0;
    z-index: 7730;
  }

  :host([isOpen]) {
    display: flex;
  } */

  /* .modal-overlay {
    width: 100%;
    opacity: 0;
  } */

  .modal-backdrop {
    position: fixed;
    width: 100%;
    height: 100%;
    opacity: 0;
    display: none;
  }

  .modal-container {
    width: min(calc(100% - 32px), 400px);
    height: auto;
    max-height: min(calc(100vh - 64px), 550px);
    overflow: hidden;
  }
`;

@customElement("ledger-modal")
@tailwindElement(styles)
export class LedgerModal extends LitElement {
  @state()
  isClosing = false;

  @query("ledger-toolbar")
  private toolbarElement!: HTMLElement;

  @query(".modal-backdrop")
  private backdropElement!: HTMLElement;

  private focusableElements: HTMLElement[] = [];
  private previousBodyOverflow = "";

  override connectedCallback() {
    super.connectedCallback();
    // document.addEventListener("keydown", this.handleKeydown);
    this.addEventListener("modal-opened", this.handleOpen);
    this.addEventListener("modal-closed", this.handleClose);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // document.removeEventListener("keydown", this.handleKeydown);
    this.removeEventListener("modal-opened", this.handleOpen);
    this.removeEventListener("modal-closed", this.handleClose);
  }

  // private handleKeydown = (event: KeyboardEvent) => {
  //   if (this.isClosing) {
  //     return;
  //   }

  //   if (event.key === "Escape") {
  //     event.preventDefault();
  //     this.closeModal();
  //   }
  // };

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

  private handleOpen() {
    this.focusFirstElement();

    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (this.backdropElement) {
      this.backdropElement.style.display = "block";
      animate(this.backdropElement, { opacity: 1 }, { duration: 0.2 });
    }
  }

  private handleClose() {
    this.isClosing = true;

    if (this.backdropElement) {
      animate(
        this.backdropElement,
        { opacity: 0 },
        {
          duration: 0.2,
          onComplete: () => {
            document.body.style.overflow = this.previousBodyOverflow;
            this.backdropElement.style.display = "none";
            this.isClosing = false;
          },
        },
      );
    }
  }

  public openModal() {
    this.dispatchEvent(
      new CustomEvent("modal-opened", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  public closeModal() {
    this.dispatchEvent(
      new CustomEvent("modal-closed", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <div
        class="modal-backdrop z-1 fixed left-0 top-0 flex h-full min-h-screen w-full content-center items-center justify-center bg-canvas-overlay"
        role="dialog"
        aria-modal="true"
        aria-describedby="modal-content"
        data-testid="modal-backdrop"
      >
        <div
          class="modal-container z-10 fixed inset-0 flex flex-col self-center justify-self-center overflow-hidden rounded-xl bg-black"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <slot name="toolbar">
            <!-- DEFAULT TOOLBAR -->
            <ledger-toolbar
              title="Ledger Button"
              aria-label="Ledger Button"
              @ledger-toolbar-close=${this.closeModal}
            ></ledger-toolbar>
          </slot>
          <div id="modal-content" class="overflow-y-auto text-base">
            <slot>hello</slot>
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

  interface WindowEventMap {
    "modal-opened": CustomEvent<void>;
    "modal-closed": CustomEvent<void>;
  }
}
