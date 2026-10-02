import "./sign-transaction";
import "../../context/core-context";
import "../../context/language-context";
import "../../components/index";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

import type { ModalGradient } from "../../components/atom/modal/ledger-modal";
import type { AnimationKey } from "../../components/index";
import type { StatusType } from "../../components/organism/status/ledger-status";
import en from "../../i18n/en.json" with { type: "json" };

// These stories render the visual layout the SignTransactionScreen produces
// without driving the controller. They are mockups for design review only.
// The controller (broadcast lifecycle, error mapping, etc.) is exercised at
// runtime; here we just preview the markup the screen will emit.
const broadcastCopy = en.signTransaction.broadcast;

type SignTransactionStoryArgs = {
  state: "signing" | StatusType;
  deviceModel: "stax" | "flex" | "nanox" | "nanosp" | "apexp";
  deviceAnimation: Extract<
    AnimationKey,
    "pin" | "continueOnLedger" | "signTransaction"
  >;
  title: string;
  description: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  broadcastState: "none" | "processing" | "validated";
};

const renderSigning = (args: SignTransactionStoryArgs) => html`
  <div
    class="flex min-h-200 flex-col items-center justify-center gap-24 self-stretch px-24 pb-48"
  >
    <div class="w-208">
      <ledger-device-animation
        modelId=${args.deviceModel}
        animation=${args.deviceAnimation}
      ></ledger-device-animation>
    </div>
    <div class="flex flex-col items-center gap-8 self-stretch">
      <p class="body-1 text-center">${args.title}</p>
      <p class="text-muted body-2 text-center">${args.description}</p>
    </div>
  </div>
`;

const renderBroadcastCard = (args: SignTransactionStoryArgs) => {
  if (args.broadcastState === "none" || args.state !== "success") {
    return null;
  }
  const copy = broadcastCopy[args.broadcastState];
  return html`
    <ledger-status-card
      slot="card"
      state=${args.broadcastState}
      title=${copy.title}
      description=${copy.description}
    ></ledger-status-card>
  `;
};

const renderStatus = (args: SignTransactionStoryArgs) => html`
  <div
    class="flex min-h-0 flex-col items-stretch justify-center self-stretch p-24 pt-0"
  >
    <ledger-status
      type=${args.state}
      title=${args.title}
      description=${args.description}
      primary-button-label=${args.primaryButtonLabel}
      secondary-button-label=${args.secondaryButtonLabel}
    >
      ${renderBroadcastCard(args)}
    </ledger-status>
  </div>
`;

const resolveGradient = (
  state: SignTransactionStoryArgs["state"],
): ModalGradient | undefined =>
  state === "success" || state === "error" ? state : undefined;

const meta: Meta<SignTransactionStoryArgs> = {
  title: "Screens/SignTransaction/SignTransactionScreen",
  render: (args) => html`
    <core-provider>
      <language-provider>
        <ledger-modal-story-wrapper
          gradient=${ifDefined(resolveGradient(args.state))}
        >
          ${args.state === "signing" ? renderSigning(args) : renderStatus(args)}
        </ledger-modal-story-wrapper>
      </language-provider>
    </core-provider>
  `,
  argTypes: {
    state: {
      control: { type: "select" },
      options: ["signing", "success", "error"],
      description: "Which screen variant to display",
      table: {
        type: { summary: "signing | success | error" },
        defaultValue: { summary: "signing" },
      },
    },
    deviceModel: {
      control: { type: "select" },
      options: ["stax", "flex", "nanox", "nanosp", "apexp"],
      description: "Device model (used when state is signing)",
      if: { arg: "state", eq: "signing" },
    },
    deviceAnimation: {
      control: { type: "select" },
      options: ["pin", "continueOnLedger", "signTransaction"],
      description: "Device animation (used when state is signing)",
      if: { arg: "state", eq: "signing" },
    },
    title: {
      control: { type: "text" },
      description: "Main title shown in the screen",
    },
    description: {
      control: { type: "text" },
      description: "Description shown below the title",
    },
    primaryButtonLabel: {
      control: { type: "text" },
      description: "Primary button label (used when state is success or error)",
      if: { arg: "state", neq: "signing" },
    },
    secondaryButtonLabel: {
      control: { type: "text" },
      description:
        "Secondary button label (used when state is success or error)",
      if: { arg: "state", neq: "signing" },
    },
    broadcastState: {
      control: { type: "select" },
      options: ["none", "processing", "validated"],
      description:
        "Broadcast status card displayed under the title (success only)",
      if: { arg: "state", eq: "success" },
      table: {
        type: { summary: "none | processing | validated" },
        defaultValue: { summary: "none" },
      },
    },
  },
  args: {
    state: "signing",
    deviceModel: "stax",
    deviceAnimation: "signTransaction",
    title: "Confirm on your Stax",
    description: "Review and sign the transaction on your device.",
    primaryButtonLabel: "Close",
    secondaryButtonLabel: "View transaction",
    broadcastState: "none",
  },
};

export default meta;
type Story = StoryObj<SignTransactionStoryArgs>;

export const Signing: Story = {
  args: {
    state: "signing",
    deviceModel: "stax",
    deviceAnimation: "signTransaction",
    title: "Confirm on your Stax",
    description: "Review and sign the transaction on your device.",
  },
};

export const Success: Story = {
  args: {
    state: "success",
    title: en.signTransaction.success.title,
    description: en.signTransaction.success.description,
    primaryButtonLabel: en.common.button.close,
    secondaryButtonLabel: en.signTransaction.success.viewTransaction,
  },
};

export const SuccessProcessing: Story = {
  args: {
    state: "success",
    title: en.signTransaction.success.title,
    description: "",
    primaryButtonLabel: en.common.button.close,
    secondaryButtonLabel: en.signTransaction.success.viewTransaction,
    broadcastState: "processing",
  },
};

export const SuccessValidated: Story = {
  args: {
    state: "success",
    title: en.signTransaction.success.title,
    description: "",
    primaryButtonLabel: en.common.button.close,
    secondaryButtonLabel: en.signTransaction.success.viewTransaction,
    broadcastState: "validated",
  },
};

export const Error: Story = {
  args: {
    state: "error",
    title: "Transaction failed",
    description: "There was an error processing your transaction.",
    primaryButtonLabel: "Try again",
    secondaryButtonLabel: "Cancel",
  },
};
