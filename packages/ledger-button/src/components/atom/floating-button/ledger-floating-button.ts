import "../icon/ledger-icon";

import { consume } from "@lit/context";
import { cva } from "class-variance-authority";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import { tailwindElement } from "../../../tailwind-element.js";
import { FloatingButtonController } from "./ledger-floating-button-controller.js";

export type FloatingButtonPosition =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "top-right"
  | "top-left"
  | "top-center"
  | "middle-right";

export type FloatingButtonVariant = "circular" | "compact";

const floatingButtonVariants = cva(
  "flex cursor-pointer items-center justify-center bg-black text-on-interactive shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-[transform,box-shadow] duration-200 ease-in-out hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)]",
  {
    variants: {
      variant: {
        circular:
          "fixed z-[1000] h-64 w-64 rounded-full border border-muted-subtle hover:scale-105 active:scale-95",
        compact:
          "content-stretch gap-8 overflow-hidden rounded-md px-12 py-8",
      },
      position: {
        "bottom-right": "bottom-24 right-24",
        "bottom-left": "bottom-24 left-24",
        "bottom-center": "bottom-24 left-1/2 -translate-x-1/2",
        "top-right": "right-24 top-24",
        "top-left": "left-24 top-24",
        "top-center": "left-1/2 top-24 -translate-x-1/2",
        "middle-right": "right-24 top-1/2 -translate-y-1/2",
        none: "",
      },
    },
    compoundVariants: [
      {
        variant: "circular",
        class: "fixed z-[1000]",
      },
    ],
    defaultVariants: {
      variant: "circular",
      position: "bottom-right",
    },
  },
);

const styles = css`
  :host {
    display: contents;
  }

  :host([hidden]) {
    display: none;
  }
`;

@customElement("ledger-floating-button")
@tailwindElement(styles)
export class LedgerFloatingButton extends LitElement {
  @consume({ context: coreContext })
  @state()
  private coreContext!: CoreContext;

  @property({ type: Object, attribute: false })
  core?: CoreContext;

  @property({ type: String })
  position: FloatingButtonPosition = "bottom-right";

  @property({ type: String })
  variant: FloatingButtonVariant = "circular";

  private controller!: FloatingButtonController;

  private get floatingButtonClasses() {
    const pos = this.variant === "compact" ? "none" : this.position;
    return {
      [floatingButtonVariants({ variant: this.variant, position: pos })]: true,
    };
  }

  override connectedCallback() {
    super.connectedCallback();
    const coreInstance = this.core || this.coreContext;
    if (coreInstance) {
      this.controller = new FloatingButtonController(this, coreInstance);
    }
  }

  override updated() {
    const coreInstance = this.core || this.coreContext;
    if (!this.controller && coreInstance) {
      this.controller = new FloatingButtonController(this, coreInstance);
      this.requestUpdate();
    }
  }

  private handleClick = () => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-floating-button-click", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    if (!this.controller?.shouldShow) {
      return nothing;
    }

    const iconSize = this.variant === "compact" ? "small" : "large";

    return html`
      <button
        class=${classMap(this.floatingButtonClasses)}
        @click=${this.handleClick}
        aria-label="Open Ledger account menu"
      >
        <ledger-icon
          type="ledger"
          size=${iconSize}
          fillColor="white"
        ></ledger-icon>
        ${this.variant === "compact"
          ? html`<span
              class="font-medium leading-normal shrink-0 not-italic text-white"
              >Ledger</span
            >`
          : nothing}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-floating-button": LedgerFloatingButton;
  }
}
