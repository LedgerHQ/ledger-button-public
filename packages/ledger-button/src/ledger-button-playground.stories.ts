import "./ledger-button-playground";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Demo/LedgerButtonPlayground",
  render: (args) => html`
    <ledger-button-playground
      .demoMode=${args.demoMode}
      .transactionData=${args.transactionData}
    ></ledger-button-playground>
  `,
  argTypes: {
    demoMode: {
      control: { type: "select" },
      options: ["onboarding", "signTransaction"],
      description: "Choose the demo flow to show",
    },
    transactionData: {
      control: { type: "object" },
      description: "Transaction data for sign transaction demo",
    },
  },
};

export default meta;
type Story = StoryObj;

export const Onboarding: Story = {
  args: {
    demoMode: "onboarding",
  },
};

export const SignTransaction: Story = {
  args: {
    demoMode: "signTransaction",
    transactionData: {
      to: "0x742d35Cc6634C0532925a3b8D35d423B2e5AC4A8",
      value: "1000000000000000000", // 1 ETH
      chainId: 1,
      maxFeePerGas: "30000000000", // 30 gwei
      maxPriorityFeePerGas: "2000000000", // 2 gwei
      gasLimit: "21000",
      nonce: 0,
      type: "eip1559",
    },
  },
};

export const SignERC20Transfer: Story = {
  args: {
    demoMode: "signTransaction",
    transactionData: {
      to: "0xA0b86a33E6815E2D5e7B4a00ad4Bd5085E0A4D9e", // ERC20 contract
      value: "0",
      chainId: 1,
      maxFeePerGas: "40000000000", // 40 gwei
      maxPriorityFeePerGas: "3000000000", // 3 gwei
      gasLimit: "65000",
      nonce: 1,
      type: "eip1559",
      data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d35d423b2e5ac4a8000000000000000000000000000000000000000000000000000000174876e800", // transfer(address,uint256)
    },
  },
};

export const SignPolygonTransaction: Story = {
  args: {
    demoMode: "signTransaction",
    transactionData: {
      to: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI on Polygon
      value: "0",
      chainId: 137, // Polygon
      maxFeePerGas: "50000000000", // 50 gwei
      maxPriorityFeePerGas: "2000000000", // 2 gwei
      gasLimit: "50000",
      nonce: 2,
      type: "eip1559",
    },
  },
};
