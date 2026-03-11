import "../icon/ledger-icon";

import { consume } from "@lit/context";
import { cva } from "class-variance-authority";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
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
  "text-on-interactive flex cursor-pointer items-center justify-center bg-black shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-[transform,box-shadow] duration-200 ease-in-out hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)]",
  {
    variants: {
      variant: {
        circular:
          "border-muted-subtle fixed z-[1000] h-64 w-64 rounded-full border hover:scale-105 active:scale-95",
        compact: "content-stretch gap-8 overflow-hidden rounded-md px-12 py-8",
      },
      position: {
        "bottom-right": "right-24 bottom-24",
        "bottom-left": "bottom-24 left-24",
        "bottom-center": "bottom-24 left-1/2 -translate-x-1/2",
        "top-right": "top-24 right-24",
        "top-left": "top-24 left-24",
        "top-center": "top-24 left-1/2 -translate-x-1/2",
        "middle-right": "top-1/2 right-24 -translate-y-1/2",
        none: "",
      },
    },
    compoundVariants: [
      {
        variant: "circular",
        class: "fixed z-1000",
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
  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

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

    const translations = this.languages?.currentTranslation;
    const ariaLabel = translations?.common?.floatingButton?.ariaLabel;
    const buttonLabel = translations?.common?.floatingButton?.label;
    const iconSize = this.variant === "compact" ? "small" : "large";

    return html`
      <button
        class=${classMap(this.floatingButtonClasses)}
        @click=${this.handleClick}
        aria-label=${ariaLabel}
      >
        <ledger-icon
          type="ledger"
          size=${iconSize}
          fillColor="white"
        ></ledger-icon>
        ${this.variant === "compact"
          ? html`<span
              class="shrink-0 leading-normal font-medium text-white not-italic"
              >${buttonLabel}</span
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
