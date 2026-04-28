import "./ledger-status-card";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import en from "../../../i18n/en.json" with { type: "json" };

const broadcastCopy = en.signTransaction.broadcast;

const meta: Meta = {
  title: "Component/Molecule/StatusCard",
  component: "ledger-status-card",
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: { type: "select" },
      options: ["processing", "validated"],
      description: "Visual state of the status card",
      table: {
        type: { summary: "processing | validated" },
        defaultValue: { summary: "processing" },
      },
    },
    title: {
      control: { type: "text" },
      description: "Card title",
      table: { type: { summary: "string" } },
    },
    description: {
      control: { type: "text" },
      description: "Card description",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    state: "processing",
    title: broadcastCopy.processing.title,
    description: broadcastCopy.processing.description,
  },
};

export default meta;
type Story = StoryObj;

export const Processing: Story = {
  args: {
    state: "processing",
    title: broadcastCopy.processing.title,
    description: broadcastCopy.processing.description,
  },
};

export const Validated: Story = {
  args: {
    state: "validated",
    title: broadcastCopy.validated.title,
    description: broadcastCopy.validated.description,
  },
};

export const Both: Story = {
  render: () => html`
    <div class="flex flex-col gap-12" style="max-width: 352px;">
      <ledger-status-card
        state="processing"
        title=${broadcastCopy.processing.title}
        description=${broadcastCopy.processing.description}
      ></ledger-status-card>
      <ledger-status-card
        state="validated"
        title=${broadcastCopy.validated.title}
        description=${broadcastCopy.validated.description}
      ></ledger-status-card>
    </div>
  `,
};
