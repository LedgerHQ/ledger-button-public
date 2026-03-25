import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  shift,
} from "@floating-ui/dom";
import { cva } from "class-variance-authority";
import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface LedgerTooltipAttributes {
  content?: string;
  side?: TooltipSide;
  sideOffset?: number;
  open?: boolean;
  autoHideDelay?: number;
}

const ARROW_SIZE = 5;

const tooltipContentVariants = cva(
  "z-tooltip w-fit rounded-xs border border-muted-subtle bg-base text-base shadow-sm select-none text-balance body-3",
  {
    variants: {
      side: {
        top: "",
        bottom: "",
        left: "",
        right: "",
      },
      state: {
        open: "",
        closed: "",
        hidden: "",
      },
    },
    compoundVariants: [
      { side: "top", state: "open", class: "animate-slide-in-from-top" },
      { side: "top", state: "closed", class: "animate-slide-out-to-top" },
      {
        side: "bottom",
        state: "open",
        class: "animate-slide-in-from-bottom",
      },
      {
        side: "bottom",
        state: "closed",
        class: "animate-slide-out-to-bottom",
      },
      { side: "left", state: "open", class: "animate-slide-in-from-left" },
      { side: "left", state: "closed", class: "animate-slide-out-to-left" },
      { side: "right", state: "open", class: "animate-slide-in-from-right" },
      {
        side: "right",
        state: "closed",
        class: "animate-slide-out-to-right",
      },
    ],
    defaultVariants: {
      side: "top",
      state: "hidden",
    },
  },
);

const styles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  .tooltip-trigger {
    display: inline-flex;
    width: fit-content;
    max-width: 100%;
  }

  .tooltip-popup {
    position: absolute;
    top: 0;
    left: 0;
    width: max-content;
    pointer-events: none;
  }

  .tooltip-popup[data-state="hidden"] {
    opacity: 0;
    pointer-events: none;
  }

  .tooltip-arrow {
    position: absolute;
    rotate: 45deg;
    background: var(--background-base);
    border: 1px solid var(--border-muted-subtle);
  }
`;

@customElement("ledger-tooltip")
@tailwindElement(styles)
export class LedgerTooltip extends LitElement {
  @property({ type: String })
  content = "";

  @property({ type: String })
  side: TooltipSide = "top";

  @property({ type: Number })
  sideOffset = 0;

  @property({ type: Boolean })
  open = false;

  @property({ type: Number })
  autoHideDelay = 0;

  @state()
  private _visible = false;

  @state()
  private _closing = false;

  @query(".tooltip-trigger")
  private triggerEl!: HTMLElement;

  @query(".tooltip-popup")
  private popupEl!: HTMLElement;

  @query(".tooltip-arrow")
  private arrowEl!: HTMLElement;

  private _cleanupAutoUpdate: (() => void) | null = null;
  private _autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanupPositioning();
    this.clearAutoHideTimer();
  }

  override updated(changedProperties: Map<PropertyKey, unknown>): void {
    if (changedProperties.has("open")) {
      if (this.open) {
        this.show();
      } else if (changedProperties.get("open") === true) {
        this.hide();
      }
    }
  }

  private handleMouseEnter = (): void => {
    if (!this.open) {
      this.show();
    }
  };

  private handleMouseLeave = (): void => {
    if (!this.open) {
      this.hide();
    }
  };

  private show(): void {
    this._closing = false;
    this._visible = true;
    this.startPositioning();
    this.startAutoHideTimer();
  }

  private hide(): void {
    if (!this._visible || this._closing) return;
    this._closing = true;
    this.clearAutoHideTimer();
  }

  private handleAnimationEnd = (): void => {
    if (this._closing) {
      this._visible = false;
      this._closing = false;
      this.cleanupPositioning();
    }
  };

  private startAutoHideTimer(): void {
    this.clearAutoHideTimer();
    if (this.autoHideDelay > 0) {
      this._autoHideTimer = setTimeout(() => {
        this.open = false;
        this.hide();
        this.dispatchEvent(
          new CustomEvent("ledger-tooltip-auto-hide", {
            bubbles: true,
            composed: true,
          }),
        );
      }, this.autoHideDelay);
    }
  }

  private clearAutoHideTimer(): void {
    if (this._autoHideTimer) {
      clearTimeout(this._autoHideTimer);
      this._autoHideTimer = null;
    }
  }

  private startPositioning(): void {
    this.cleanupPositioning();
    this.updateComplete.then(() => {
      if (!this.triggerEl || !this.popupEl) return;

      this._cleanupAutoUpdate = autoUpdate(this.triggerEl, this.popupEl, () =>
        this.updatePosition(),
      );
    });
  }

  private async updatePosition(): Promise<void> {
    if (!this.triggerEl || !this.popupEl) return;

    const placement: Placement = this.side;

    const {
      x,
      y,
      placement: actualPlacement,
      middlewareData,
    } = await computePosition(this.triggerEl, this.popupEl, {
      placement,
      middleware: [
        offset(ARROW_SIZE + this.sideOffset),
        flip(),
        shift({ padding: 8 }),
        arrowMiddleware({ element: this.arrowEl }),
      ],
    });

    Object.assign(this.popupEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    if (middlewareData.arrow && this.arrowEl) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow;
      const staticSide = {
        top: "bottom",
        right: "left",
        bottom: "top",
        left: "right",
      }[actualPlacement.split("-")[0]] as string;

      Object.assign(this.arrowEl.style, {
        left: arrowX != null ? `${arrowX}px` : "",
        top: arrowY != null ? `${arrowY}px` : "",
        right: "",
        bottom: "",
        [staticSide]: `${-ARROW_SIZE}px`,
      });
    }
  }

  private cleanupPositioning(): void {
    if (this._cleanupAutoUpdate) {
      this._cleanupAutoUpdate();
      this._cleanupAutoUpdate = null;
    }
  }

  private get tooltipState(): "open" | "closed" | "hidden" {
    if (this._visible && !this._closing) return "open";
    if (this._visible && this._closing) return "closed";
    return "hidden";
  }

  private getTooltipPopupClassMap(): Record<string, boolean> {
    const map: Record<string, boolean> = { "tooltip-popup": true };
    const variantClasses = tooltipContentVariants({
      side: this.side,
      state: this.tooltipState,
    });
    for (const token of variantClasses.trim().split(/\s+/)) {
      if (token) map[token] = true;
    }
    return map;
  }

  override render() {
    if (!this.content) {
      return html`<slot></slot>`;
    }

    return html`
      <div
        class="tooltip-trigger"
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
        @focusin=${this.handleMouseEnter}
        @focusout=${this.handleMouseLeave}
      >
        <slot></slot>
      </div>
      <div
        class=${classMap(this.getTooltipPopupClassMap())}
        role="tooltip"
        data-state=${this.tooltipState}
        @animationend=${this.handleAnimationEnd}
      >
        <div class="tooltip-arrow size-10"></div>
        <div class="bg-base relative z-1 rounded-xs px-8 py-4">
          ${this.content}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-tooltip": LedgerTooltip;
  }

  interface WindowEventMap {
    "ledger-tooltip-auto-hide": CustomEvent;
  }
}

export default LedgerTooltip;
