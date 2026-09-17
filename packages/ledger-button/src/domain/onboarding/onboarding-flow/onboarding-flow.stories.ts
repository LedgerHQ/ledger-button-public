import "./onboarding-flow";
import "../../../context/core-context";
import "../../../context/language-context";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Flow/Onboarding",
  render: () => html`
    <core-provider>
      <language-provider>
        <onboarding-flow></onboarding-flow>
      </language-provider>
    </core-provider>
  `,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const InContext: Story = {
  render: () => html`
    <core-provider>
      <language-provider>
        <ledger-modal-story-wrapper title="Connect a Ledger device">
          <onboarding-flow></onboarding-flow>
        </ledger-modal-story-wrapper>
      </language-provider>
    </core-provider>
  `,
};
