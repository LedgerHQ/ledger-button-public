import "../button/ledger-button";
import "./ledger-tooltip";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { LedgerTooltipAttributes } from "./ledger-tooltip";
import type { LedgerTooltip } from "./ledger-tooltip";

const meta: Meta<LedgerTooltipAttributes> = {
  title: "Component/Atom/Tooltip",
  tags: ["autodocs"],
  render: (args) => html`
    <div
      style="display: flex; justify-content: center; align-items: center; min-height: 200px;"
    >
      <ledger-tooltip
        .content=${args.content || ""}
        .side=${args.side || "top"}
        .sideOffset=${args.sideOffset || 0}
      >
        <ledger-button label="Hover me" variant="secondary"></ledger-button>
      </ledger-tooltip>
    </div>
  `,
  argTypes: {
    content: {
      control: "text",
      description: "The text displayed inside the tooltip",
    },
    side: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Preferred side to position the tooltip",
    },
    sideOffset: {
      control: "number",
      description: "Additional offset in pixels from the trigger element",
    },
  },
};

export default meta;
type Story = StoryObj<LedgerTooltipAttributes>;

export const Default: Story = {
  args: {
    content: "New transaction pending",
    side: "top",
    sideOffset: 0,
  },
};

export const Bottom: Story = {
  args: {
    content: "New transaction pending",
    side: "bottom",
    sideOffset: 0,
  },
};

export const Left: Story = {
  args: {
    content: "New transaction pending",
    side: "left",
    sideOffset: 0,
  },
};

export const Right: Story = {
  args: {
    content: "New transaction pending",
    side: "right",
    sideOffset: 0,
  },
};

export const AllSides: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 64px; padding: 80px; justify-items: center; align-items: center;"
    >
      <ledger-tooltip content="Top tooltip" side="top">
        <ledger-button label="Top" variant="secondary"></ledger-button>
      </ledger-tooltip>
      <ledger-tooltip content="Bottom tooltip" side="bottom">
        <ledger-button label="Bottom" variant="secondary"></ledger-button>
      </ledger-tooltip>
      <ledger-tooltip content="Left tooltip" side="left">
        <ledger-button label="Left" variant="secondary"></ledger-button>
      </ledger-tooltip>
      <ledger-tooltip content="Right tooltip" side="right">
        <ledger-button label="Right" variant="secondary"></ledger-button>
      </ledger-tooltip>
    </div>
  `,
};

export const ProgrammaticOpen: Story = {
  render: () => {
    const handleToggle = () => {
      const tooltip = document.querySelector(
        "#programmatic-tooltip",
      ) as LedgerTooltip | null;
      if (tooltip) {
        tooltip.open = !tooltip.open;
      }
    };

    return html`
      <div
        style="display: flex; flex-direction: column; align-items: center; gap: 32px; padding: 80px;"
      >
        <ledger-tooltip
          id="programmatic-tooltip"
          content="Transaction signed!"
          .open=${false}
        >
          <ledger-button
            label="I have a tooltip"
            variant="secondary"
          ></ledger-button>
        </ledger-tooltip>
        <ledger-button
          label="Toggle tooltip"
          variant="primary"
          @click=${handleToggle}
        ></ledger-button>
        <p style="font-size: 12px; color: #6B7280;">
          Click "Toggle tooltip" to show/hide the tooltip programmatically.
        </p>
      </div>
    `;
  },
};

export const ProgrammaticWithAutoHide: Story = {
  render: () => {
    const handleShow = () => {
      const tooltip = document.querySelector(
        "#autohide-tooltip",
      ) as LedgerTooltip | null;
      if (tooltip) {
        tooltip.open = true;
      }
    };

    return html`
      <div
        style="display: flex; flex-direction: column; align-items: center; gap: 32px; padding: 80px;"
      >
        <ledger-tooltip
          id="autohide-tooltip"
          content="Transaction signed successfully!"
          .open=${false}
          .autoHideDelay=${3000}
          @ledger-tooltip-auto-hide=${() => {
            console.log("Tooltip auto-hidden");
          }}
        >
          <ledger-button
            label="Sign transaction"
            variant="secondary"
          ></ledger-button>
        </ledger-tooltip>
        <ledger-button
          label="Simulate transaction signed"
          variant="primary"
          @click=${handleShow}
        ></ledger-button>
        <p style="font-size: 12px; color: #6B7280;">
          Click "Simulate transaction signed" to show a tooltip that auto-hides
          after 3 seconds.
        </p>
      </div>
    `;
  },
};
