import "../../components/index.js";

import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { TransactionType } from "../../components/molecule/transaction-item/ledger-transaction-item.js";
import { tailwindElement } from "../../tailwind-element.js";

export type TransactionListItem = {
  hash: string;
  type: TransactionType;
  date: string;
  time: string;
  amount: string;
  ticker: string;
  title: string;
  fiatAmount: string;
  fiatCurrency: string;
};

type GroupedTransactions = {
  date: string;
  displayDate: string;
  transactions: TransactionListItem[];
};

@customElement("transaction-list-screen")
@tailwindElement()
export class TransactionListScreen extends LitElement {
  @property({ type: Array })
  transactions: TransactionListItem[] = [];

  private formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private groupTransactionsByDate(): GroupedTransactions[] {
    const sortedTransactions = [...this.transactions].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    const groups: Map<string, TransactionListItem[]> = new Map();

    for (const transaction of sortedTransactions) {
      const dateKey = transaction.date;
      const existingGroup = groups.get(dateKey);
      if (existingGroup) {
        existingGroup.push(transaction);
      } else {
        groups.set(dateKey, [transaction]);
      }
    }

    return Array.from(groups.entries()).map(([date, transactions]) => ({
      date,
      displayDate: this.formatDisplayDate(date),
      transactions,
    }));
  }

  private renderTransactionItem = (transaction: TransactionListItem) => {
    return html`
      <ledger-transaction-item
        .type=${transaction.type}
        .title=${transaction.title}
        .timestamp=${transaction.time}
        .amount=${transaction.amount}
        .ticker=${transaction.ticker}
        .fiatAmount=${transaction.fiatAmount}
        .fiatCurrency=${transaction.fiatCurrency}
      ></ledger-transaction-item>
    `;
  };

  private renderDateHeader(displayDate: string) {
    return html`
      <div
        class="flex items-center justify-start gap-8 rounded-sm bg-muted-transparent px-8 py-4"
      >
        <span class="text-white body-4">${displayDate}</span>
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

  private renderEmptyState() {
    return html`
      <div
        class="flex flex-col items-center justify-center py-48 text-center"
      >
        <span class="text-muted body-2">No transactions found</span>
      </div>
    `;
  }

  override render(): TemplateResult {
    if (this.transactions.length === 0) {
      return this.renderEmptyState();
    }

    const groupedTransactions = this.groupTransactionsByDate();

    return html`
      <div class="flex flex-col gap-16">
        ${groupedTransactions.map((group) =>
          this.renderTransactionGroup(group),
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "transaction-list-screen": TransactionListScreen;
  }
}
