import "./device-animation";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { LedgerDeviceAnimation } from "./device-animation";

const meta: Meta<LedgerDeviceAnimation> = {
  title: "Component/Molecule/DeviceAnimation",
  component: "ledger-device-animation",
  argTypes: {
    modelId: {
      control: { type: "select" },
      options: ["nanos", "nanosp", "nanox", "stax", "flex"],
    },
    animation: {
      control: { type: "select" },
      options: [
        "pin",
        "pairing",
        "pairingSuccess",
        "frontView",
        "continueOnLedger",
        "signTransaction",
      ],
    },
    autoplay: { control: "boolean" },
    loop: { control: "boolean" },
  },
  args: {
    modelId: "stax",
    animation: "continueOnLedger",
    autoplay: true,
    loop: true,
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<LedgerDeviceAnimation>;

export const Default: Story = {
  render: (args) => html`
    <ledger-device-animation
      .modelId=${args.modelId}
      .animation=${args.animation}
      .autoplay=${args.autoplay}
      .loop=${args.loop}
    ></ledger-device-animation>
  `,
};

export const AllDeviceAnimations: Story = {
  render: (args) => html`
    <div style="display: flex; flex-wrap: wrap; gap: 2rem;">
      ${(["nanos", "nanosp", "nanox", "stax", "flex"] as const).map(
        (modelId) => html`
          <div
            style="flex: 0 0 220px; display: flex; flex-direction: column; align-items: center;"
          >
            <div style="margin-bottom: 0.5rem; font-weight: bold;">
              ${modelId}
            </div>
            <ledger-device-animation
              .modelId=${modelId}
              .animation=${args.animation}
              .autoplay=${args.autoplay}
              .loop=${args.loop}
            ></ledger-device-animation>
          </div>
        `,
      )}
    </div>
  `,
  args: {
    animation: "continueOnLedger",
    autoplay: true,
    loop: true,
  },
};
