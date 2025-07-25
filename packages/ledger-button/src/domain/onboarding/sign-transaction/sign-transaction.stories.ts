import "./sign-transaction";
import "../../../context/core-context.js";
import "../../../context/language-context.js";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Screens/Onboarding/SignTransactionScreen",
  render: (args) => html`
    <core-provider>
      <language-provider>
        <div
          class="flex flex-col rounded-xl bg-black"
          style="width: 400px; min-height: 400px; max-height: calc(100vh - 64px);"
        >
          <div class="flex-1 overflow-y-auto">
            <sign-transaction-screen
              .state=${args.state}
              .deviceModel=${args.deviceModel}
              .transactionId=${args.transactionId}
              .transactionData=${args.transactionData}
            ></sign-transaction-screen>
          </div>
        </div>
      </language-provider>
    </core-provider>
  `,
  argTypes: {
    state: {
      control: { type: "select" },
      options: ["signing", "success", "error"],
    },
    deviceModel: {
      control: { type: "select" },
      options: ["stax", "flex", "nanox", "nanos", "nanosp"],
    },
    transactionId: {
      control: { type: "text" },
    },
    transactionData: {
      control: { type: "object" },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Signing: Story = {
  args: {
    state: "signing",
    deviceModel: "stax",
    transactionId: "",
    transactionData: {
      to: "0x742d35Cc6634C0532925a3b8D35d423B2e5AC4A8",
      value: "1000000000000000000",
      chainId: 1, // Ethereum
      gasLimit: "21000",
      gasPrice: "20000000000",
      nonce: 0,
    },
  },
};

export const SigningNanoX: Story = {
  args: {
    state: "signing",
    deviceModel: "nanox",
    transactionId: "",
    transactionData: {
      to: "0x742d35Cc6634C0532925a3b8D35d423B2e5AC4A8",
      value: "500000000000000000",
      chainId: 1, // Ethereum
      gasLimit: "21000",
      gasPrice: "15000000000",
      nonce: 1,
    },
  },
};

export const SigningFlex: Story = {
  args: {
    state: "signing",
    deviceModel: "flex",
    transactionId: "",
    transactionData: {
      to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
      value: "250000000000000000",
      chainId: 1, // Ethereum
      gasLimit: "21000",
      gasPrice: "25000000000",
      nonce: 2,
    },
  },
};

export const Success: Story = {
  args: {
    state: "success",
    deviceModel: "stax",
    transactionId: "0x1234567890abcdef1234567890abcdef12345678",
    transactionData: {
      to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
      value: "1000000000000000000",
      chainId: 1, // Ethereum mainnet
      gasLimit: "21000",
      gasPrice: "20000000000",
      nonce: 0,
    },
  },
};

export const Error: Story = {
  args: {
    state: "error",
    deviceModel: "stax",
    transactionId: "",
    transactionData: {
      to: "0x742d35Cc6634C0532925a3b8D35d423B2e5AC4A8",
      value: "1000000000000000000",
      chainId: 1, // Ethereum
      gasLimit: "21000",
      gasPrice: "20000000000",
      nonce: 0,
    },
  },
};

export const ERC20Transfer: Story = {
  args: {
    state: "signing",
    deviceModel: "stax",
    transactionId: "",
    transactionData: {
      to: "0xA0b86a33E6815E2D5e7B4a00ad4Bd5085E0A4D9e", // ERC20 contract
      value: "0",
      chainId: 1, // Ethereum
      gasLimit: "65000",
      gasPrice: "30000000000",
      nonce: 3,
      data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d35d423b2e5ac4a8000000000000000000000000000000000000000000000000000000174876e800", // transfer(address,uint256)
    },
  },
};

export const ContractInteraction: Story = {
  args: {
    state: "signing",
    deviceModel: "flex",
    transactionId: "",
    transactionData: {
      to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI token contract
      value: "0",
      chainId: 1, // Ethereum mainnet
      gasLimit: "100000",
      maxFeePerGas: "40000000000", // 40 gwei
      maxPriorityFeePerGas: "3000000000", // 3 gwei
      type: "eip1559", // EIP-1559 transaction
      nonce: 4,
      data: "0x095ea7b3000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // approve(address,uint256)
    },
  },
};

export const PolygonTransaction: Story = {
  args: {
    state: "signing",
    deviceModel: "nanox",
    transactionId: "",
    transactionData: {
      to: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI on Polygon
      value: "0",
      chainId: 137, // Polygon
      gasLimit: "50000",
      gasPrice: "30000000000",
      nonce: 5,
    },
  },
};

export const LegacyTransaction: Story = {
  args: {
    state: "signing",
    deviceModel: "stax",
    transactionId: "",
    transactionData: {
      to: "0x742d35Cc6634C0532925a3b8D35d423B2e5AC4A8",
      value: "1000000000000000000", // 1 ETH in wei
      chainId: 1, // Ethereum mainnet
      gasLimit: "21000",
      maxFeePerGas: "30000000000", // 30 gwei - EIP-1559
      maxPriorityFeePerGas: "2000000000", // 2 gwei tip
      type: "eip1559",
      nonce: 0,
    },
  },
};

export const HighPriorityTransaction: Story = {
  args: {
    state: "signing",
    deviceModel: "flex",
    transactionId: "",
    transactionData: {
      to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
      value: "500000000000000000", // 0.5 ETH in wei
      chainId: 1, // Ethereum mainnet
      gasLimit: "21000",
      maxFeePerGas: "100000000000", // 100 gwei - high priority
      maxPriorityFeePerGas: "10000000000", // 10 gwei - high tip
      type: "eip1559", // EIP-1559 transaction
      nonce: 7,
    },
  },
};
