import "../../atom/toast/ledger-toast";

import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import { tailwindElement } from "../../../tailwind-element.js";
import {
  TOAST_STACK_REFLOW_MS,
  type ToastVariant,
} from "../../atom/toast/ledger-toast";

export interface TransactionNotification {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
  duration?: number;
  autoDismiss?: boolean;
}

export type TransactionNotificationInput = Omit<
  TransactionNotification,
  "id"
> & {
  id?: string;
};

const styles = css`
  :host {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    width: 352px;
    max-width: calc(100vw - 32px);
  }

  ledger-toast {
    pointer-events: auto;
  }
`;

@customElement("ledger-transaction-notifications")
@tailwindElement(styles)
export class LedgerTransactionNotifications extends LitElement {
  @state()
  private _notifications: TransactionNotification[] = [];

  push(notification: TransactionNotificationInput): string {
    const id = notification.id ?? this.generateId();
    const entry: TransactionNotification = { ...notification, id };
    this._notifications = [...this._notifications, entry];

    return id;
  }

  dismiss(id: string): void {
    this._notifications = this._notifications.filter((n) => n.id !== id);
  }

  clear(): void {
    this._notifications = [];
  }

  get notifications(): readonly TransactionNotification[] {
    return this._notifications;
  }

  override render() {
    return html`
      ${repeat(
        this._notifications,
        (n) => n.id,
        (n) => html`
          <ledger-toast
            .variant=${n.variant}
            .title=${n.title}
            .description=${n.description ?? ""}
            .linkText=${n.linkText ?? ""}
            .linkHref=${n.linkHref ?? ""}
            .duration=${n.duration ?? 5000}
            .autoDismiss=${n.autoDismiss ?? true}
            @ledger-toast-closing=${this.handleToastClosing}
            @ledger-toast-close=${() => this.handleToastClose(n.id)}
          ></ledger-toast>
        `,
      )}
    `;
  }

  private handleToastClosing = (event: Event) => {
    const closingToast = event.target;

    if (!(closingToast instanceof HTMLElement) || closingToast.tagName !== "LEDGER-TOAST") {
      return;
    }

    if (!this.contains(closingToast)) {
      return;
    }

    const toasts = [
      ...this.querySelectorAll("ledger-toast"),
    ] as HTMLElement[];
    const index = toasts.indexOf(closingToast);

    if (index === -1 || index >= toasts.length - 1) {
      return;
    }

    const offset = this.getReflowOffset(closingToast, toasts, index);

    requestAnimationFrame(() => {
      for (let i = index + 1; i < toasts.length; i++) {
        const toast = toasts[i];
        toast.style.transition = `transform ${TOAST_STACK_REFLOW_MS}ms ease-in-out`;
        toast.style.transform = "translateY(0)";
        void toast.offsetWidth;
        toast.style.transform = `translateY(-${offset}px)`;
      }
    });
  };

  private handleToastClose(id: string) {
    this.clearSiblingTransforms();
    this.dismiss(id);
  }

  private getReflowOffset(
    closingToast: HTMLElement,
    toasts: HTMLElement[],
    index: number,
  ): number {
    const nextToast = toasts[index + 1];
    const closingRect = closingToast.getBoundingClientRect();
    const nextRect = nextToast.getBoundingClientRect();

    return nextRect.top - closingRect.top;
  }

  private clearSiblingTransforms(): void {
    this.querySelectorAll("ledger-toast").forEach((toast) => {
      const element = toast as HTMLElement;
      element.style.transition = "";
      element.style.transform = "";
    });
  }

  private generateId(): string {
    return `tx-toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-transaction-notifications": LedgerTransactionNotifications;
  }
}

export default LedgerTransactionNotifications;
