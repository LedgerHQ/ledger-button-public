import "./ledger-home";
import "../../context/core-context.js";
import "../../context/language-context.js";
import "@ledgerhq/ledger-button-ui";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Screens/Home/LedgerHomeScreen",
  render: () => html`
    <core-provider .stub=${true} .stubDevice=${true}>
      <language-provider>
        <ledger-home-screen .demoMode=${true}></ledger-home-screen>
      </language-provider>
    </core-provider>
  `,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const InContext: Story = {
  render: () => html`
    <core-provider .stub=${true} .stubDevice=${true}>
      <language-provider>
        <ledger-modal-story-wrapper title="Home">
          <ledger-home-screen .demoMode=${true}></ledger-home-screen>
        </ledger-modal-story-wrapper>
      </language-provider>
    </core-provider>
  `,
};
