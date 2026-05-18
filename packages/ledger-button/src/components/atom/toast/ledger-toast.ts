import "../icon/ledger-icon";

import { cva } from "class-variance-authority";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

export type ToastVariant = "success" | "fail";
export type ToastCloseReason = "user" | "timeout";

export interface LedgerToastAttributes {
  variant?: ToastVariant;
  title?: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
  duration?: number;
  autoDismiss?: boolean;
  dismissible?: boolean;
}

const containerVariants = cva([
  "relative flex w-full flex-col gap-4 rounded-md bg-surface px-12 py-10",
]);

const iconWrapperVariants = cva(["flex items-center pt-4"], {
  variants: {
    variant: {
      success: "text-success",
      fail: "text-error",
    },
  },
  defaultVariants: {
    variant: "success",
  },
});

const closeButtonVariants = cva([
  "flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none p-8",
  "bg-muted text-base hover:bg-muted-hover active:bg-muted-pressed",
]);

const linkVariants = cva([
  "flex cursor-pointer items-center gap-8 border-none bg-transparent p-0 text-muted",
  "body-2-semi-bold underline",
]);

export const TOAST_EXIT_DURATION_MS = 300;
export const TOAST_STACK_REFLOW_MS = 300;

const FADE_DURATION_MS = TOAST_EXIT_DURATION_MS;

const styles = css`
  :host {
    display: block;
    width: 100%;
    overflow: hidden;
    opacity: 1;
    transform: translateX(0);
    margin-bottom: 8px;
    transition:
      opacity 200ms ease-in-out,
      transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  :host([data-state="entering"]) {
    opacity: 0;
    transform: translateX(100%);
    transition: none;
  }

  :host([data-state="closing"]) {
    opacity: 0;
    transition: opacity 300ms ease-in-out;
  }

  :host([data-state="closed"]) {
    display: none;
  }
`;

@customElement("ledger-toast")
@tailwindElement(styles)
export class LedgerToast extends LitElement {
  @property({ type: String })
  variant: ToastVariant = "success";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  description = "";

  @property({ type: String, attribute: "link-text" })
  linkText = "";

  @property({ type: String, attribute: "link-href" })
  linkHref = "";

  @property({ type: Number })
  duration = 1000;

  @property({ type: Boolean, attribute: "auto-dismiss" })
  autoDismiss = true;

  @property({ type: Boolean })
  dismissible = true;

  @state()
  private _closing = false;

  @state()
  private _closed = false;

  private _dismissTimer: ReturnType<typeof setTimeout> | null = null;

  private _fadeTimer: ReturnType<typeof setTimeout> | null = null;

  private _closeReason: ToastCloseReason = "timeout";

  override connectedCallback() {
    super.connectedCallback();
    this.startEntering();
    this.scheduleAutoDismiss();
    this.addEventListener("transitionend", this.handleHostTransitionEnd);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimers();
    this.removeEventListener("transitionend", this.handleHostTransitionEnd);
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has("autoDismiss") || changed.has("duration")) {
      this.scheduleAutoDismiss();
    }
  }

  override render() {
    if (this._closed) {
      return nothing;
    }

    const role = this.variant === "fail" ? "alert" : "status";
    const ariaLive = this.variant === "fail" ? "assertive" : "polite";

    return html`
      <div
        class=${classMap({
          [containerVariants()]: true,
          "toast-container": true,
        })}
        role=${role}
        aria-live=${ariaLive}
      >
        ${this.renderTopRow()} ${this.renderActionRow()}
      </div>
    `;
  }

  private renderTopRow() {
    return html`
      <div class="flex w-full items-start gap-16">
        <div class="flex min-w-0 flex-1 items-start gap-8">
          ${this.renderIcon()} ${this.renderContent()}
        </div>
        ${this.renderCloseButton()}
      </div>
    `;
  }

  private renderIcon() {
    return html`
      <div class=${iconWrapperVariants({ variant: this.variant })}>
        <ledger-icon
          .type=${this.iconType}
          size="medium"
          fillColor="currentColor"
        ></ledger-icon>
      </div>
    `;
  }

  private renderContent() {
    return html`
      <div class="flex min-w-0 flex-1 flex-col">
        ${this.title
          ? html`
              <p
                class="body-1-semi-bold overflow-hidden py-4 text-ellipsis text-base"
              >
                ${this.title}
              </p>
            `
          : nothing}
        ${this.description
          ? html`
              <p class="body-2 overflow-hidden py-6 text-ellipsis text-muted">
                ${this.description}
              </p>
            `
          : nothing}
      </div>
    `;
  }

  private renderCloseButton() {
    if (!this.dismissible) {
      return nothing;
    }

    return html`
      <button
        class=${closeButtonVariants()}
        type="button"
        aria-label="Close"
        @click=${this.handleCloseClick}
      >
        <ledger-icon
          type="close"
          size="small"
          fillColor="currentColor"
        ></ledger-icon>
      </button>
    `;
  }

  private renderActionRow() {
    if (!this.linkText || !this.linkHref) {
      return nothing;
    }

    return html`
      <div class="flex items-start pt-0 pr-0 pb-4 pl-32">
        <a
          class=${linkVariants()}
          href=${this.linkHref}
          target="_blank"
          rel="noopener noreferrer"
          @click=${this.handleLinkClick}
        >
          <span>${this.linkText}</span>
          <ledger-icon
            type="externalLink"
            size="20"
            fillColor="currentColor"
          ></ledger-icon>
        </a>
      </div>
    `;
  }

  private get iconType() {
    return this.variant === "success"
      ? "checkMarkCircleFill"
      : "deleteCircleFill";
  }

  private scheduleAutoDismiss() {
    this.clearDismissTimer();

    if (!this.autoDismiss || this._closing || this._closed) {
      return;
    }

    this._dismissTimer = setTimeout(() => {
      this.startClosing("timeout");
    }, this.duration);
  }

  private startEntering() {
    this.dataset.state = "entering";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this._closing || this._closed) {
          return;
        }

        this.dataset.state = "open";
      });
    });
  }

  private startClosing(reason: ToastCloseReason) {
    if (this._closing || this._closed) {
      return;
    }

    this.clearDismissTimer();
    this._closing = true;
    this._closeReason = reason;

    this.dispatchEvent(
      new CustomEvent("ledger-toast-closing", {
        bubbles: true,
        composed: true,
        detail: {
          reason,
          variant: this.variant,
          title: this.title,
        },
      }),
    );

    this.dataset.state = "closing";

    this._fadeTimer = setTimeout(() => {
      this.finalizeClose(reason);
    }, FADE_DURATION_MS + 50);
  }

  private finalizeClose(reason: ToastCloseReason) {
    if (this._closed) {
      return;
    }

    this._closed = true;
    this.dataset.state = "closed";
    this.clearTimers();

    this.dispatchEvent(
      new CustomEvent("ledger-toast-close", {
        bubbles: true,
        composed: true,
        detail: {
          reason,
          variant: this.variant,
          title: this.title,
        },
      }),
    );
  }

  private handleHostTransitionEnd = (event: Event) => {
    if (!(event instanceof TransitionEvent)) {
      return;
    }

    if (event.target !== this || !this._closing) {
      return;
    }

    if (event.propertyName !== "opacity") {
      return;
    }

    this.finalizeClose(this._closeReason);
  };

  private handleCloseClick() {
    this.startClosing("user");
  }

  private handleLinkClick() {
    this.dispatchEvent(
      new CustomEvent("ledger-toast-link-click", {
        bubbles: true,
        composed: true,
        detail: {
          variant: this.variant,
          title: this.title,
          href: this.linkHref,
        },
      }),
    );
  }

  private clearDismissTimer() {
    if (this._dismissTimer !== null) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
  }

  private clearTimers() {
    this.clearDismissTimer();

    if (this._fadeTimer !== null) {
      clearTimeout(this._fadeTimer);
      this._fadeTimer = null;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-toast": LedgerToast;
  }

  interface WindowEventMap {
    "ledger-toast-closing": CustomEvent<{
      reason: ToastCloseReason;
      variant: ToastVariant;
      title: string;
    }>;
    "ledger-toast-close": CustomEvent<{
      reason: ToastCloseReason;
      variant: ToastVariant;
      title: string;
    }>;
    "ledger-toast-link-click": CustomEvent<{
      variant: ToastVariant;
      title: string;
      href: string;
    }>;
  }
}

export default LedgerToast;
