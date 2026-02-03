import "./ledger-skeleton";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { LedgerSkeletonAttributes } from "./ledger-skeleton";

const meta: Meta<LedgerSkeletonAttributes> = {
  title: "Component/Atom/Skeleton",
  tags: ["autodocs"],
  render: (args) => html`
    <ledger-skeleton .width=${args.width} .height=${args.height}></ledger-skeleton>
  `,
  argTypes: {
    width: {
      control: "text",
      description: "Width (e.g., '100px', '50%', '10rem')",
    },
    height: {
      control: "text",
      description: "Height (e.g., '20px', '100%', '5rem')",
    },
  },
  decorators: [
    (story) => html`
      <div class="lb-rounded-md lb-bg-canvas-sheet lb-p-16">${story()}</div>
    `,
  ],
};

export default meta;
type Story = StoryObj<LedgerSkeletonAttributes>;

export const Base: Story = {
  args: {
    width: "256px",
    height: "16px",
  },
};

export const SizeShowcase: Story = {
  render: () => html`
    <div class="lb-flex lb-flex-col lb-gap-4">
      <ledger-skeleton width="56px" height="40px"></ledger-skeleton>
      <ledger-skeleton width="112px" height="12px"></ledger-skeleton>
      <ledger-skeleton width="256px" height="128px"></ledger-skeleton>
    </div>
  `,
};

export const ShapeShowcase: Story = {
  render: () => html`
    <div class="lb-flex lb-flex-col lb-gap-4">
      <ledger-skeleton
        width="256px"
        height="40px"
        class="lb-rounded-none"
      ></ledger-skeleton>
      <ledger-skeleton
        width="256px"
        height="40px"
        class="lb-rounded-lg"
      ></ledger-skeleton>
      <ledger-skeleton
        width="48px"
        height="48px"
        class="lb-rounded-full"
      ></ledger-skeleton>
    </div>
  `,
};

export const TextLinesShowcase: Story = {
  render: () => html`
    <div class="lb-flex lb-flex-col lb-gap-8">
      <ledger-skeleton width="100%" height="16px"></ledger-skeleton>
      <ledger-skeleton width="75%" height="16px"></ledger-skeleton>
      <ledger-skeleton width="50%" height="16px"></ledger-skeleton>
    </div>
  `,
};

export const AccountItemExample: Story = {
  render: () => html`
    <div
      class="lb-flex lb-max-w-[400px] lb-items-center lb-gap-12 lb-rounded-lg lb-bg-muted lb-p-16"
    >
      <ledger-skeleton
        width="40px"
        height="40px"
        class="lb-rounded-full"
      ></ledger-skeleton>
      <div class="lb-flex lb-flex-1 lb-flex-col lb-gap-8">
        <ledger-skeleton width="120px" height="16px"></ledger-skeleton>
        <ledger-skeleton width="80px" height="12px"></ledger-skeleton>
      </div>
      <ledger-skeleton width="60px" height="16px"></ledger-skeleton>
    </div>
  `,
};
