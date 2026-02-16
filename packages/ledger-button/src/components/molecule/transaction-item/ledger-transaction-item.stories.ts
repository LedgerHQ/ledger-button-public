import "./ledger-transaction-item";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Component/Molecule/ListItems/Transaction",
  tags: ["autodocs"],
  render: (args) => html`
    <div class="min-w-352">
      <ledger-transaction-item
        .type=${args.type}
        .title=${args.title}
        .timestamp=${args.timestamp}
        .amount=${args.amount}
        .ticker=${args.ticker}
        .fiatAmount=${args.fiatAmount}
        .fiatCurrency=${args.fiatCurrency}
      ></ledger-transaction-item>
    </div>
  `,
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["sent", "received"],
      description: "The type of transaction (arrow up for sent, down for received)",
      table: {
        type: { summary: '"sent" | "received"' },
        category: "Required",
      },
    },
    title: {
      control: "text",
      description: "The token/coin name",
      table: {
        type: { summary: "string" },
        category: "Required",
      },
    },
    timestamp: {
      control: "text",
      description: "The transaction timestamp (e.g., '22:34')",
      table: {
        type: { summary: "string" },
        category: "Required",
      },
    },
    amount: {
      control: "text",
      description: "The transaction amount value",
      table: {
        type: { summary: "string" },
        category: "Required",
      },
    },
    ticker: {
      control: "text",
      description: "The currency ticker symbol",
      table: {
        type: { summary: "string" },
        category: "Required",
      },
    },
    fiatAmount: {
      control: "text",
      description: "The fiat value of the transaction",
      table: {
        type: { summary: "string" },
        category: "Required",
      },
    },
    fiatCurrency: {
      control: "text",
      description: "The fiat currency symbol (e.g., '$', '€')",
      table: {
        type: { summary: "string" },
        category: "Required",
      },
    },
  },
  args: {
    type: "received",
    title: "Ethereum",
    timestamp: "22:34",
    amount: "1.30393",
    ticker: "ETH",
    fiatAmount: "3,259.83",
    fiatCurrency: "$",
  },
};

export default meta;
type Story = StoryObj;

export const ReceivedTransaction: Story = {
  args: {
    type: "received",
    title: "Ethereum",
    timestamp: "22:34",
    amount: "1.30393",
    ticker: "ETH",
    fiatAmount: "3,259.83",
    fiatCurrency: "$",
  },
};

export const SentTransaction: Story = {
  args: {
    type: "sent",
    title: "Ethereum",
    timestamp: "22:34",
    amount: "1.30393",
    ticker: "ETH",
    fiatAmount: "3,259.83",
    fiatCurrency: "$",
  },
};

export const TransactionList: Story = {
  render: () => html`
    <div class="flex flex-col gap-12 min-w-352">
      <ledger-transaction-item
        type="received"
        title="Ethereum"
        timestamp="22:34"
        amount="1.30393"
        ticker="ETH"
        fiat-amount="3,259.83"
        fiat-currency="$"
      ></ledger-transaction-item>
      <ledger-transaction-item
        type="sent"
        title="Ethereum"
        timestamp="22:34"
        amount="1.30393"
        ticker="ETH"
        fiat-amount="3,259.83"
        fiat-currency="$"
      ></ledger-transaction-item>
      <ledger-transaction-item
        type="received"
        title="Bitcoin"
        timestamp="14:22"
        amount="0.05432"
        ticker="BTC"
        fiat-amount="5,432.00"
        fiat-currency="$"
      ></ledger-transaction-item>
      <ledger-transaction-item
        type="sent"
        title="Polygon"
        timestamp="10:15"
        amount="500.00"
        ticker="MATIC"
        fiat-amount="250.00"
        fiat-currency="$"
      ></ledger-transaction-item>
    </div>
  `,
};

export const LargeAmount: Story = {
  args: {
    type: "received",
    title: "Ethereum",
    timestamp: "14:22",
    amount: "125.98765432",
    ticker: "ETH",
    fiatAmount: "314,969.13",
    fiatCurrency: "$",
  },
};

export const SmallAmount: Story = {
  args: {
    type: "sent",
    title: "Ethereum",
    timestamp: "09:15",
    amount: "0.00001234",
    ticker: "ETH",
    fiatAmount: "0.03",
    fiatCurrency: "$",
  },
};

export const BitcoinTransaction: Story = {
  args: {
    type: "received",
    title: "Bitcoin",
    timestamp: "18:45",
    amount: "0.05432100",
    ticker: "BTC",
    fiatAmount: "5,432.10",
    fiatCurrency: "$",
  },
};

export const EuroTransaction: Story = {
  args: {
    type: "received",
    title: "Ethereum",
    timestamp: "16:30",
    amount: "2.5",
    ticker: "ETH",
    fiatAmount: "6,250.00",
    fiatCurrency: "€",
  },
};
