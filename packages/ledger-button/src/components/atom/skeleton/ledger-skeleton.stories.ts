import "./ledger-skeleton";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { LedgerSkeletonAttributes } from "./ledger-skeleton";

const meta: Meta<LedgerSkeletonAttributes> = {
  title: "Component/Atom/Skeleton",
  tags: ["autodocs"],
  render: (args) => html`
    <ledger-skeleton
      .variant=${args.variant || "text"}
      .width=${args.width}
      .height=${args.height}
    ></ledger-skeleton>
  `,
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "block"],
      description: "Shape variant of the skeleton",
    },
    width: {
      control: "text",
      description: "Width (e.g., '100px', '50%', '10rem')",
    },
    height: {
      control: "text",
      description: "Height (e.g., '20px', '100%', '5rem')",
    },
  },
};

export default meta;
type Story = StoryObj<LedgerSkeletonAttributes>;

export const TextDefault: Story = {
  args: {
    variant: "text",
    width: "200px",
  },
};

export const TextFullWidth: Story = {
  args: {
    variant: "text",
    width: "100%",
  },
};

export const BlockSmall: Story = {
  args: {
    variant: "block",
    width: "100px",
    height: "100px",
  },
};

export const BlockRectangle: Story = {
  args: {
    variant: "block",
    width: "200px",
    height: "120px",
  },
};

export const TextVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <h3
        style="margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #9ca3af;"
      >
        Text variants
      </h3>
      <ledger-skeleton variant="text" width="80%"></ledger-skeleton>
      <ledger-skeleton variant="text" width="60%"></ledger-skeleton>
      <ledger-skeleton variant="text" width="90%"></ledger-skeleton>
      <ledger-skeleton variant="text" width="40%"></ledger-skeleton>
    </div>
  `,
};

export const BlockVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <h3
        style="margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #9ca3af;"
      >
        Block variants
      </h3>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <ledger-skeleton
          variant="block"
          width="80px"
          height="80px"
        ></ledger-skeleton>
        <ledger-skeleton
          variant="block"
          width="120px"
          height="80px"
        ></ledger-skeleton>
        <ledger-skeleton
          variant="block"
          width="160px"
          height="100px"
        ></ledger-skeleton>
      </div>
    </div>
  `,
};

export const AccountItemSkeleton: Story = {
  render: () => html`
    <div
      style="display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; max-width: 400px;"
    >
      <ledger-skeleton
        variant="block"
        width="40px"
        height="40px"
        style="border-radius: 50%;"
      ></ledger-skeleton>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
        <ledger-skeleton variant="text" width="120px"></ledger-skeleton>
        <ledger-skeleton
          variant="text"
          width="80px"
          height="0.8em"
        ></ledger-skeleton>
      </div>
      <ledger-skeleton variant="text" width="60px"></ledger-skeleton>
    </div>
  `,
};

export const CardSkeleton: Story = {
  render: () => html`
    <div
      style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 16px; max-width: 300px;"
    >
      <ledger-skeleton
        variant="block"
        width="100%"
        height="150px"
        style="margin-bottom: 16px;"
      ></ledger-skeleton>
      <ledger-skeleton
        variant="text"
        width="70%"
        style="margin-bottom: 8px;"
      ></ledger-skeleton>
      <ledger-skeleton
        variant="text"
        width="90%"
        style="margin-bottom: 8px;"
      ></ledger-skeleton>
      <ledger-skeleton variant="text" width="50%"></ledger-skeleton>
    </div>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 32px;">
      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #9ca3af;"
        >
          Text variant
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-skeleton variant="text" width="100%"></ledger-skeleton>
          <ledger-skeleton variant="text" width="75%"></ledger-skeleton>
          <ledger-skeleton variant="text" width="50%"></ledger-skeleton>
        </div>
      </div>

      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #9ca3af;"
        >
          Block variant
        </h3>
        <div style="display: flex; gap: 16px; align-items: flex-start;">
          <ledger-skeleton
            variant="block"
            width="100px"
            height="100px"
          ></ledger-skeleton>
          <ledger-skeleton
            variant="block"
            width="150px"
            height="80px"
          ></ledger-skeleton>
          <ledger-skeleton
            variant="block"
            width="200px"
            height="120px"
          ></ledger-skeleton>
        </div>
      </div>

      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #9ca3af;"
        >
          Custom sizes
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-skeleton
            variant="text"
            width="200px"
            height="24px"
          ></ledger-skeleton>
          <ledger-skeleton
            variant="text"
            width="150px"
            height="16px"
          ></ledger-skeleton>
          <ledger-skeleton
            variant="text"
            width="100px"
            height="12px"
          ></ledger-skeleton>
        </div>
      </div>
    </div>
  `,
};
