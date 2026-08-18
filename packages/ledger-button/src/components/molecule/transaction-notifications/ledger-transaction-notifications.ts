import "../../atom/toast/ledger-toast";

import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import { tailwindElement } from "../../../tailwind-element";
import type { ToastVariant } from "../../atom/toast/ledger-toast";

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
            .duration=${n.duration ?? 8000}
            .autoDismiss=${n.autoDismiss ?? true}
            @ledger-toast-close=${() => this.handleToastClose(n.id)}
          ></ledger-toast>
        `,
      )}
    `;
  }

  private handleToastClose(id: string) {
    this.dismiss(id);
  }

  private generateId(): string {
    return `tx-toast-${crypto.randomUUID()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-transaction-notifications": LedgerTransactionNotifications;
  }
}

export default LedgerTransactionNotifications;
