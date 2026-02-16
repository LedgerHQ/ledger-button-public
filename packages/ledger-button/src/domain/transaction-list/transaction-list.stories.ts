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

const sampleTransactions: TransactionListItem[] = [
  {
    hash: "0x1234",
    type: "received",
    date: today,
    time: "22:34",
    amount: "1.30393",
    ticker: "ETH",
    title: "Ethereum",
    fiatAmount: "3,259.83",
    fiatCurrency: "$",
  },
  {
    hash: "0x1235",
    type: "sent",
    date: today,
    time: "22:34",
    amount: "1.30393",
    ticker: "ETH",
    title: "Ethereum",
    fiatAmount: "3,259.83",
    fiatCurrency: "$",
  },
  {
    hash: "0x1236",
    type: "received",
    date: today,
    time: "22:34",
    amount: "1.30393",
    ticker: "ETH",
    title: "Ethereum",
    fiatAmount: "3,259.83",
    fiatCurrency: "$",
  },
  {
    hash: "0x1237",
    type: "received",
    date: today,
    time: "22:34",
    amount: "1.30393",
    ticker: "ETH",
    title: "Ethereum",
    fiatAmount: "3,259.83",
    fiatCurrency: "$",
  },
  {
    hash: "0x1238",
    type: "sent",
    date: yesterday,
    time: "14:22",
    amount: "0.5",
    ticker: "ETH",
    title: "Ethereum",
    fiatAmount: "1,250.00",
    fiatCurrency: "$",
  },
  {
    hash: "0x1239",
    type: "received",
    date: yesterday,
    time: "10:15",
    amount: "2.0",
    ticker: "ETH",
    title: "Ethereum",
    fiatAmount: "5,000.00",
    fiatCurrency: "$",
  },
  {
    hash: "0x123a",
    type: "sent",
    date: lastWeek,
    time: "18:45",
    amount: "0.25",
    ticker: "ETH",
    title: "Ethereum",
    fiatAmount: "625.00",
    fiatCurrency: "$",
  },
];

const meta: Meta = {
  title: "Screens/Home/TransactionListScreen",
  tags: ["autodocs"],
  render: (args) => html`
    <div class="min-w-352 dark">
      <transaction-list-screen
        .transactions=${args.transactions}
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
  },
  args: {
    transactions: sampleTransactions,
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
      {
        hash: "0xbtc1",
        type: "received",
        date: today,
        time: "15:30",
        amount: "0.05432100",
        ticker: "BTC",
        title: "Bitcoin",
        fiatAmount: "5,432.10",
        fiatCurrency: "$",
      },
      {
        hash: "0xbtc2",
        type: "sent",
        date: yesterday,
        time: "09:15",
        amount: "0.01234567",
        ticker: "BTC",
        title: "Bitcoin",
        fiatAmount: "1,234.57",
        fiatCurrency: "$",
      },
    ],
  },
};

export const MixedTokens: Story = {
  args: {
    transactions: [
      {
        hash: "0xeth1",
        type: "received",
        date: today,
        time: "22:34",
        amount: "1.30393",
        ticker: "ETH",
        title: "Ethereum",
        fiatAmount: "3,259.83",
        fiatCurrency: "$",
      },
      {
        hash: "0xbtc1",
        type: "sent",
        date: today,
        time: "18:15",
        amount: "0.05",
        ticker: "BTC",
        title: "Bitcoin",
        fiatAmount: "5,000.00",
        fiatCurrency: "$",
      },
      {
        hash: "0xmatic1",
        type: "received",
        date: yesterday,
        time: "14:30",
        amount: "500.00",
        ticker: "MATIC",
        title: "Polygon",
        fiatAmount: "250.00",
        fiatCurrency: "$",
      },
    ],
  },
};
