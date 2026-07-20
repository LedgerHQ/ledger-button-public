import "../icon/ledger-icon";
import "../tooltip/ledger-tooltip";
import "./ledger-floating-button-badge";

import { consume } from "@lit/context";
import { cva } from "class-variance-authority";
import { css, html, LitElement, nothing, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { tailwindElement } from "../../../tailwind-element.js";
import type { TransactionConfirmationNotification } from "../../../types/transaction-confirmation-notification.js";
import { BadgeAnimationController } from "./floating-button-badge-animation-controller.js";
import { resolveTooltipContent } from "./floating-button-tooltip-utils.js";
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

// The stack was raised to z-index 10000+ so Ledger UI renders above dApp Morpho (z-index 9999).
//   - `.modal-backdrop`  → z-index 10000
//   - `.modal-container` → z-index 10001
//   - this floating btn  → z-index 10002
// so that at the end of the morph-close animation the real button can
// take over the same pixels as the morphed pill underneath.
// Tailwind offset/size classes below must stay in sync with
// `FLOATING_BUTTON_SIZE` / `FLOATING_BUTTON_OFFSET` in
// `floating-button-rect.ts` (h-64/w-64 + right-24/bottom-24/…).
const positionVariants = cva("fixed z-[10002]", {
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

  @keyframes ledger-floating-button-logo-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .floating-button-logo-fade-in {
    animation: ledger-floating-button-logo-fade-in 220ms ease-out both;
    animation-delay: 60ms;
  }
`;

const BADGE_MASK_GRADIENT =
  "radial-gradient(circle closest-side at 87.5% 12.5%, transparent 185%, white 195%)";

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
  @consume({ context: langContext, subscribe: true })
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

  @property({ type: String, attribute: false })
  transactionConfirmationNotification: TransactionConfirmationNotification =
    "tooltip";

  /**
   * Whether to apply the logo fade-in class on the next render. We want
   * the fade to play exactly once each time the button (re)appears
   * (initial mount, or after a modal close), and never replay on routine
   * re-renders such as variant changes or a pending-tx count update.
   */
  @state()
  private playLogoFadeIn = true;

  private wasShowing = false;

  private controller!: FloatingButtonController;
  private badgeAnimCtrl!: BadgeAnimationController;

  @query("ledger-floating-button-badge")
  private readonly badgeEl!: HTMLElement | null;

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
    this.ensureControllers();
  }

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    this.ensureControllers();

    if (this.controller && this.badgeAnimCtrl) {
      this.badgeAnimCtrl.sync(
        this.controller.validatedCelebrationOpen,
        this.controller.hasPending,
        this.controller.postClosePendingTooltipOpen,
        this.controller.modalIsOpen,
      );
    }
  }

  override updated(_changedProperties: PropertyValues<this>): void {
    super.updated(_changedProperties);
    this.badgeAnimCtrl?.flush();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.badgeAnimCtrl?.cancel();
  }

  private ensureControllers(): void {
    const coreInstance = this.core || this.coreContext;
    if (!this.controller && coreInstance) {
      this.controller = new FloatingButtonController(
        this,
        coreInstance,
        this.transactionConfirmationNotification,
      );
      this.badgeAnimCtrl = new BadgeAnimationController(
        this,
        () => this.badgeEl,
      );
      this.requestUpdate();
    }

    const isShowing = this.controller?.shouldShow ?? false;
    if (!isShowing && this.wasShowing) {
      // Arm the fade-in for the next time the button re-appears.
      this.playLogoFadeIn = true;
    }
    this.wasShowing = isShowing;
  }

  private readonly handleLogoFadeInEnd = (): void => {
    this.playLogoFadeIn = false;
  };

  private handleClick = () => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-floating-button-click", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  private readonly handleControlledTooltipAutoHide = (): void => {
    const text =
      this.languages?.currentTranslation?.common?.floatingButton
        ?.newTransactionPending ?? "New transaction pending";
    this.controller?.handleTooltipAutoHide(text);
  };

  override render() {
    if (!this.controller?.shouldShow) {
      return nothing;
    }

    const i18n = this.languages?.currentTranslation?.common?.floatingButton;
    const showBadge = this.badgeAnimCtrl?.showBadgeChrome ?? false;

    const { content: tooltipContent, isControlled: tooltipControlledOpen } =
      resolveTooltipContent(
        {
          dismissingContent: this.controller.dismissingTooltipContent,
          celebrationOpen: this.controller.validatedCelebrationOpen,
          validatedCount: this.controller.validatedCount,
          postCloseTooltipOpen: this.controller.postClosePendingTooltipOpen,
          pendingCount: this.controller.pendingTransactionCount,
          delayTooltipOpen: this.badgeAnimCtrl?.delayTooltipOpen ?? false,
        },
        {
          pendingHoverTemplate:
            i18n?.pendingTransactionsHover ??
            "You have {count} pending transactions",
          newTransactionPendingText:
            i18n?.newTransactionPending ?? "New transaction pending",
          validatedOne:
            i18n?.transactionsValidatedOne ??
            "1 transaction has been validated",
          validatedOther:
            i18n?.transactionsValidatedOther ??
            "{count} transactions have been validated",
        },
      );

    const button = this.renderButton(i18n?.ariaLabel, i18n?.label, showBadge);

    const mainContent = this.controller.needsTooltip
      ? this.renderWithTooltip(button, tooltipContent, tooltipControlledOpen)
      : button;

    return html`
      <div class=${classMap(this.positionClasses)}>
        ${showBadge
          ? html`
              <div class="relative inline-block">
                ${mainContent}
                <ledger-floating-button-badge
                  variant=${this.badgeAnimCtrl.resolvedBadgeVariant}
                  .count=${this.controller.frozenBadgeCount ??
                  this.controller.pendingTransactionCount}
                ></ledger-floating-button-badge>
              </div>
            `
          : mainContent}
      </div>
    `;
  }

  private renderButton(
    ariaLabel: string | undefined,
    buttonLabel: string | undefined,
    showBadgeChrome: boolean,
  ) {
    const iconSize = this.variant === "compact" ? 16 : 32;
    const iconMaskStyle = showBadgeChrome
      ? `-webkit-mask-image: ${BADGE_MASK_GRADIENT}; mask-image: ${BADGE_MASK_GRADIENT};`
      : "";
    const logoFadeClasses = {
      "floating-button-logo-fade-in": this.playLogoFadeIn,
      "inline-flex": true,
      "items-center": true,
      "justify-center": true,
      "gap-8": true,
    };

    return html`
      <button
        class=${classMap(this.floatingButtonClasses)}
        style="${iconMaskStyle}"
        @click=${this.handleClick}
        aria-label=${ariaLabel}
      >
        <span
          class=${classMap(logoFadeClasses)}
          @animationend=${this.handleLogoFadeInEnd}
        >
          <ledger-icon
            type="ledger"
            .size=${iconSize}
            fillColor="white"
          ></ledger-icon>
          ${this.variant === "compact"
            ? html`<span
                class="shrink-0 leading-normal font-medium text-white not-italic"
                >${buttonLabel}</span
              >`
            : nothing}
        </span>
      </button>
    `;
  }

  private renderWithTooltip(
    button: unknown,
    content: string,
    controlled: boolean,
  ) {
    return html`
      <ledger-tooltip
        .content=${content}
        side="top"
        .sideOffset=${8}
        .open=${controlled}
        .autoHideDelay=${controlled ? 3000 : 0}
        @ledger-tooltip-auto-hide=${this.handleControlledTooltipAutoHide}
      >
        ${button}
      </ledger-tooltip>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-floating-button": LedgerFloatingButton;
  }
}
