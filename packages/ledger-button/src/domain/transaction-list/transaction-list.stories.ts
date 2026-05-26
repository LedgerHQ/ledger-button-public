import "./transaction-list";
import "../../components/index.js";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { TransactionListItem } from "./transaction-list";

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const lastWeek = new Date(Date.now() - 86400000 * 7)
  .toISOString()
  .split("T")[0];

function makeTx(
  overrides: Partial<TransactionListItem> & Pick<TransactionListItem, "hash">,
): TransactionListItem {
  return {
    type: "received",
    status: "confirmed",
    kind: "transfer",
    date: today,
    time: "22:34",
    amount: "1.30393",
    ticker: "ETH",
    title: "Ethereum",
    fiatAmount: "3,259.83",
    fiatCurrency: "$",
    ...overrides,
  };
}

const sampleTransactions: TransactionListItem[] = [
  makeTx({ hash: "0x1234", type: "received" }),
  makeTx({ hash: "0x1235", type: "sent" }),
  makeTx({ hash: "0x1236", type: "received" }),
  makeTx({ hash: "0x1237", type: "received" }),
  makeTx({
    hash: "0x1238",
    type: "sent",
    date: yesterday,
    time: "14:22",
    amount: "0.5",
    fiatAmount: "1,250.00",
  }),
  makeTx({
    hash: "0x1239",
    type: "received",
    date: yesterday,
    time: "10:15",
    amount: "2.0",
    fiatAmount: "5,000.00",
  }),
  makeTx({
    hash: "0x123a",
    type: "sent",
    date: lastWeek,
    time: "18:45",
    amount: "0.25",
    fiatAmount: "625.00",
  }),
];

const meta: Meta = {
  title: "Screens/Home/TransactionListScreen",
  tags: ["autodocs"],
  render: (args) => html`
    <div class="min-w-352 dark">
      <transaction-list-screen
        .transactions=${args.transactions}
        .pendingTransactions=${args.pendingTransactions ?? []}
        @view-all-transactions-click=${args.onViewAllTransactionsClick}
      ></transaction-list-screen>
    </div>
  `,
  argTypes: {
    transactions: {
      control: "object",
      description: "Array of transaction items",
      table: {
        type: { summary: "TransactionListItem[]" },
        category: "Required",
      },
    },
    pendingTransactions: {
      control: "object",
      description: "Array of pending transaction items",
      table: {
        type: { summary: "TransactionListItem[]" },
        category: "Optional",
      },
    },
    onViewAllTransactionsClick: {
      action: "view-all-transactions-click",
      description: "Fired when the user clicks View all transactions",
    },
  },
  args: {
    transactions: sampleTransactions,
    pendingTransactions: [],
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    transactions: sampleTransactions,
  },
};

export const EmptyState: Story = {
  args: {
    transactions: [],
    pendingTransactions: [],
  },
};

export const PendingOnly: Story = {
  args: {
    transactions: [],
    pendingTransactions: [
      makeTx({
        hash: "0xpending1",
        status: "pending",
        type: "sent",
      }),
    ],
  },
};

export const TodayOnly: Story = {
  args: {
    transactions: sampleTransactions.filter((t) => t.date === today),
  },
};

export const MultipleDays: Story = {
  args: {
    transactions: sampleTransactions,
  },
};

export const Bitcoin: Story = {
  args: {
    transactions: [
      makeTx({
        hash: "0xbtc1",
        type: "received",
        time: "15:30",
        amount: "0.05432100",
        ticker: "BTC",
        title: "Bitcoin",
        fiatAmount: "5,432.10",
      }),
      makeTx({
        hash: "0xbtc2",
        type: "sent",
        date: yesterday,
        time: "09:15",
        amount: "0.01234567",
        ticker: "BTC",
        title: "Bitcoin",
        fiatAmount: "1,234.57",
      }),
    ],
  },
};

export const MixedTokens: Story = {
  args: {
    transactions: [
      makeTx({ hash: "0xeth1", type: "received" }),
      makeTx({
        hash: "0xbtc1",
        type: "sent",
        time: "18:15",
        amount: "0.05",
        ticker: "BTC",
        title: "Bitcoin",
        fiatAmount: "5,000.00",
      }),
      makeTx({
        hash: "0xmatic1",
        type: "received",
        date: yesterday,
        time: "14:30",
        amount: "500.00",
        ticker: "MATIC",
        title: "Polygon",
        fiatAmount: "250.00",
      }),
    ],
  },
};
