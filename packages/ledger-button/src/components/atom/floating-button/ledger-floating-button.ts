import "../icon/ledger-icon";
import "../tooltip/ledger-tooltip";

import { consume } from "@lit/context";
import { cva } from "class-variance-authority";
import { css, html, LitElement, nothing, type PropertyValues } from "lit";
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
        circular: "border-muted-subtle h-64 w-64 rounded-full border",
        compact: "content-stretch gap-8 overflow-hidden rounded-md px-12 py-8",
      },
    },
    defaultVariants: {
      variant: "circular",
    },
  },
);

const positionVariants = cva("fixed z-1000", {
  variants: {
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
  defaultVariants: {
    position: "bottom-right",
  },
});

const styles = css`
  :host {
    display: contents;
  }

  :host([hidden]) {
    display: none;
  }
`;

function cvaResultToClassMap(classString: string): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const token of classString.trim().split(/\s+/)) {
    if (token) map[token] = true;
  }
  return map;
}

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

  private get floatingButtonClasses(): Record<string, boolean> {
    return cvaResultToClassMap(
      floatingButtonVariants({ variant: this.variant }),
    );
  }

  private get positionClasses(): Record<string, boolean> {
    const pos = this.variant === "compact" ? "none" : this.position;
    return cvaResultToClassMap(positionVariants({ position: pos }));
  }

  override connectedCallback() {
    super.connectedCallback();
    const coreInstance = this.core || this.coreContext;
    if (coreInstance) {
      this.controller = new FloatingButtonController(this, coreInstance);
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
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

  private formatPendingHoverTemplate(template: string, count: number): string {
    return template.replace("{count}", String(count));
  }

  private handlePostCloseTooltipAutoHide = (): void => {
    this.controller?.clearPostClosePendingTooltip();
  };

  override render() {
    if (!this.controller?.shouldShow) {
      return nothing;
    }

    const translations = this.languages?.currentTranslation;
    const floatingButtonI18n = translations?.common?.floatingButton;
    const ariaLabel = floatingButtonI18n?.ariaLabel;
    const buttonLabel = floatingButtonI18n?.label;
    const pendingHoverTemplate =
      floatingButtonI18n?.pendingTransactionsHover ??
      "You have {count} pending transactions";
    const newTransactionPendingText =
      floatingButtonI18n?.newTransactionPending ?? "New transaction pending";
    const iconSize = this.variant === "compact" ? "small" : "large";

    const pendingCount = this.controller?.pendingTransactionCount ?? 0;
    const hasPending = pendingCount > 0;
    const postCloseTooltip = this.controller?.postClosePendingTooltipOpen ?? false;
    const tooltipContent = postCloseTooltip
      ? newTransactionPendingText
      : this.formatPendingHoverTemplate(pendingHoverTemplate, pendingCount);

    const maskGradient =
      "radial-gradient(circle closest-side at 87.5% 12.5%, transparent 185%, white 195%)";
    const iconMaskStyle = hasPending
      ? `-webkit-mask-image: ${maskGradient}; mask-image: ${maskGradient};`
      : "";

    const button = html`
      <button
        class=${classMap(this.floatingButtonClasses)}
        style="${iconMaskStyle}"
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

    const mainContent = hasPending
      ? html`
          <ledger-tooltip
            .content=${tooltipContent}
            side="top"
            .sideOffset=${8}
            .open=${postCloseTooltip}
            .autoHideDelay=${postCloseTooltip ? 3000 : 0}
            @ledger-tooltip-auto-hide=${this.handlePostCloseTooltipAutoHide}
          >
            ${button}
          </ledger-tooltip>
        `
      : button;

    return html`
      <div class=${classMap(this.positionClasses)}>
        ${hasPending
          ? html`
              <div class="relative inline-block">
                ${mainContent}
                <span
                  class="bg-error-strong body-2-semi-bold absolute top-[-4px] right-[-4px] z-20 inline-flex h-24 min-w-24 items-center justify-center rounded-full text-white"
                  >${pendingCount}</span
                >
              </div>
            `
          : mainContent}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-floating-button": LedgerFloatingButton;
  }
}
