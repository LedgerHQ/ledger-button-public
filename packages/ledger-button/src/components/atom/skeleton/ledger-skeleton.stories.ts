import "./ledger-skeleton";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { LedgerSkeleton } from "./ledger-skeleton";

const meta: Meta<LedgerSkeleton> = {
  title: "Component/Atom/Skeleton",
  tags: ["autodocs"],
  render: () => html`<ledger-skeleton class="h-16 w-256"></ledger-skeleton>`,
  decorators: [
    (story) => html`
      <div class="rounded-md bg-canvas-sheet p-16">${story()}</div>
    `,
  ],
};

export default meta;
type Story = StoryObj<LedgerSkeleton>;

export const Base: Story = {};

export const SizeShowcase: Story = {
  render: () => html`
    <div class="flex flex-col gap-4">
      <ledger-skeleton class="h-40 w-56"></ledger-skeleton>
      <ledger-skeleton class="h-12 w-112"></ledger-skeleton>
      <ledger-skeleton class="h-128 w-256"></ledger-skeleton>
    </div>
  `,
};

export const ShapeShowcase: Story = {
  render: () => html`
    <div class="flex flex-col gap-4">
      <ledger-skeleton class="h-40 w-256 rounded-none"></ledger-skeleton>
      <ledger-skeleton class="h-40 w-256 rounded-lg"></ledger-skeleton>
      <ledger-skeleton class="h-48 w-48 rounded-full"></ledger-skeleton>
    </div>
  `,
};

export const TextLinesShowcase: Story = {
  render: () => html`
    <div class="flex flex-col gap-8">
      <ledger-skeleton class="h-16 w-full"></ledger-skeleton>
      <ledger-skeleton class="h-16 w-3/4"></ledger-skeleton>
      <ledger-skeleton class="h-16 w-1/2"></ledger-skeleton>
    </div>
  `,
};

export const AccountItemExample: Story = {
  render: () => html`
    <div
      class="flex max-w-[400px] items-center gap-12 rounded-lg bg-muted p-16"
    >
      <ledger-skeleton class="h-40 w-40 rounded-full"></ledger-skeleton>
      <div class="flex flex-1 flex-col gap-8">
        <ledger-skeleton class="h-16 w-112"></ledger-skeleton>
        <ledger-skeleton class="h-12 w-80"></ledger-skeleton>
      </div>
      <ledger-skeleton class="h-16 w-56"></ledger-skeleton>
    </div>
  `,
};
