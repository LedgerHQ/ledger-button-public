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
        <div class="rounded-xl bg-black p-16" style="width: 400px">
          <sign-transaction-screen
            .state=${args.state}
            .deviceModel=${args.deviceModel}
            .transactionId=${args.transactionId}
          ></sign-transaction-screen>
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
  },
};

export default meta;
type Story = StoryObj;

export const Signing: Story = {
  args: {
    state: "signing",
    deviceModel: "stax",
    transactionId: "",
  },
};

export const SigningNanoX: Story = {
  args: {
    state: "signing",
    deviceModel: "nanox",
    transactionId: "",
  },
};

export const SigningFlex: Story = {
  args: {
    state: "signing",
    deviceModel: "flex",
    transactionId: "",
  },
};

export const Success: Story = {
  args: {
    state: "success",
    deviceModel: "stax",
    transactionId: "0x1234567890abcdef1234567890abcdef12345678",
  },
};

export const Error: Story = {
  args: {
    state: "error",
    deviceModel: "stax",
    transactionId: "",
  },
};
