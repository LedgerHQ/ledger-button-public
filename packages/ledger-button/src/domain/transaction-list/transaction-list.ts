import "../../components/index";

import { consume } from "@lit/context";
import { html, LitElement, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

import type {
  TransactionKind,
  TransactionStatus,
  TransactionType,
} from "../../components/molecule/transaction-item/ledger-transaction-item";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context";
import { tailwindElement } from "../../tailwind-element";
import {
  groupTransactionsByDate,
  type TransactionDateGroup,
} from "./group-transactions-by-date";

const TRANSACTION_HISTORY_MAX_ITEMS = 20;

export type TransactionListItem = {
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  kind: TransactionKind;
  /** ISO 8601 instant; the source of truth for ordering. */
  timestamp: string;
  /** Local calendar day (`YYYY-MM-DD`) used to group items. */
  date: string;
  time: string;
  amount: string;
  ticker: string;
  title: string;
  fiatAmount: string;
  fiatCurrency: string;
  explorerUrl?: string;
  formattedFee?: string;
  feeTicker?: string;
};

type GroupedTransactions = TransactionDateGroup<TransactionListItem>;

@customElement("transaction-list-screen")
@tailwindElement()
export class TransactionListScreen extends LitElement {
  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @property({ type: Array })
  transactions: TransactionListItem[] = [];

  @property({ type: Array })
  pendingTransactions: TransactionListItem[] = [];

  private renderTransactionItem = (transaction: TransactionListItem) => {
    const viewOnExplorerLabel =
      this.languages?.currentTranslation?.transactionList?.viewOnExplorer ??
      "View on explorer";

    return html`
      <ledger-transaction-item
        .type=${transaction.type}
        .status=${transaction.status}
        .kind=${transaction.kind}
        .title=${transaction.title}
        .timestamp=${transaction.time}
        .amount=${transaction.amount}
        .ticker=${transaction.ticker}
        .fiatAmount=${transaction.fiatAmount}
        .fiatCurrency=${transaction.fiatCurrency}
        .explorerUrl=${transaction.explorerUrl}
        .viewOnExplorerLabel=${viewOnExplorerLabel}
        .locale=${this.languages.locale}
        .hash=${transaction.hash}
        .formattedFee=${transaction.formattedFee ?? ""}
        .feeTicker=${transaction.feeTicker ?? ""}
      ></ledger-transaction-item>
    `;
  };

  private renderDateHeader(displayDate: string) {
    return html`
      <div
        class="bg-muted-transparent flex items-center justify-start gap-8 rounded-sm px-8 py-4"
      >
        <span class="body-4 text-white">${displayDate}</span>
      </div>
    `;
  }

  private renderTransactionGroup(group: GroupedTransactions) {
    return html`
      <div class="flex flex-col gap-4">
        ${this.renderDateHeader(group.displayDate)}
        <div class="flex flex-col">
          ${group.transactions.map(this.renderTransactionItem)}
        </div>
      </div>
    `;
  }

  private renderPendingSection() {
    if (this.pendingTransactions.length === 0) return "";

    const translations = this.languages.currentTranslation;

    return html`
      <div class="flex flex-col gap-4">
        ${this.renderDateHeader(
          translations.transactionList?.pendingTransactions ??
            "Pending transactions",
        )}
        <div class="flex flex-col">
          ${this.pendingTransactions.map(this.renderTransactionItem)}
        </div>
      </div>
    `;
  }

  private renderEmptyState() {
    const translations = this.languages.currentTranslation;

    return html`
      <div class="flex flex-col items-center justify-center py-48 text-center">
        <span class="text-muted body-2"
          >${translations.transactionList?.noTransactions}</span
        >
      </div>
    `;
  }

  private renderViewAllTransactionsLink() {
    const label =
      this.languages?.currentTranslation?.transactionList?.viewAllTransactions ??
      "View all transactions";

    return html`
      <button
        class="body-2-semi-bold text-base flex w-full cursor-pointer items-center justify-center gap-8"
        @click=${this.handleViewAllTransactionsClick}
      >
        <span>${label}</span>
        <ledger-icon
          type="externalLink"
          .size=${20}
          fillColor="currentColor"
        ></ledger-icon>
      </button>
    `;
  }

  private handleViewAllTransactionsClick() {
    this.dispatchEvent(
      new CustomEvent("view-all-transactions-click", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render(): TemplateResult {
    const hasPending = this.pendingTransactions.length > 0;
    const hasConfirmed = this.transactions.length > 0;

    if (!hasPending && !hasConfirmed) {
      return this.renderEmptyState();
    }

    const groupedTransactions = groupTransactionsByDate(this.transactions);

    return html`
      <div class="flex flex-col gap-32">
        <div class="flex flex-col gap-16">
          ${this.renderPendingSection()}
          ${groupedTransactions.map((group) =>
            this.renderTransactionGroup(group),
          )}
        </div>
        ${this.transactions.length >= TRANSACTION_HISTORY_MAX_ITEMS
          ? this.renderViewAllTransactionsLink()
          : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "transaction-list-screen": TransactionListScreen;
  }

  interface WindowEventMap {
    "view-all-transactions-click": CustomEvent<void>;
  }
}
