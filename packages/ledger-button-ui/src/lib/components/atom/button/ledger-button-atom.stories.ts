import "./ledger-button-atom";

import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";

import type { LedgerButtonAtomAttributes } from "./ledger-button-atom";

const meta: Meta<LedgerButtonAtomAttributes> = {
  title: "Component/Atom/Button",
  tags: ["autodocs"],
  render: (args) =>
    html`<ledger-button-atom
      .label=${args.label || ""}
      .variant=${args.variant || "primary"}
      .size=${args.size || "medium"}
      .iconPosition=${args.iconPosition || "left"}
      .type=${args.type || "button"}
      ?disabled=${args.disabled}
      ?icon=${args.icon}
      @ledger-button-click=${(e: CustomEvent) => {
        console.log("Button clicked:", e.detail);
      }}
    ></ledger-button-atom>`,
  argTypes: {
    label: {
      control: "text",
      description: "The text displayed on the button",
    },
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "select-button",
        "icon-title",
        "icon-only",
        "title-only",
      ],
      description: "The variant of the button",
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
      description: "The size of the button",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    icon: {
      control: "boolean",
      description: "Whether to show the Ledger icon",
    },
    iconPosition: {
      control: "select",
      options: ["left", "right"],
      description: "Position of the icon relative to text",
    },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
      description: "HTML button type",
    },
  },
};

export default meta;
type Story = StoryObj<LedgerButtonAtomAttributes>;

export const Primary: Story = {
  args: {
    label: "Connect Ledger",
    variant: "primary",
    size: "medium",
    disabled: false,
  },
};

export const Secondary: Story = {
  args: {
    label: "Secondary Action",
    variant: "secondary",
    size: "medium",
    disabled: false,
  },
};

export const SelectButton: Story = {
  args: {
    label: "Select Account",
    variant: "select-button",
    size: "medium",
    disabled: false,
  },
};

export const IconTitle: Story = {
  args: {
    label: "With Icon",
    variant: "icon-title",
    size: "medium",
    icon: true,
    iconPosition: "left",
    disabled: false,
  },
};

export const IconOnly: Story = {
  args: {
    variant: "icon-only",
    size: "medium",
    icon: true,
    disabled: false,
  },
};

export const TitleOnly: Story = {
  args: {
    label: "Text Link",
    variant: "title-only",
    size: "medium",
    disabled: false,
  },
};

export const SmallButtons: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-button-atom
        label="Small Primary"
        variant="primary"
        size="small"
      ></ledger-button-atom>
      <ledger-button-atom
        label="Small Secondary"
        variant="secondary"
        size="small"
      ></ledger-button-atom>
      <ledger-button-atom
        variant="icon-only"
        size="small"
        icon
      ></ledger-button-atom>
    </div>
  `,
};

export const MediumButtons: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-button-atom
        label="Medium Primary"
        variant="primary"
        size="medium"
      ></ledger-button-atom>
      <ledger-button-atom
        label="Medium Secondary"
        variant="secondary"
        size="medium"
      ></ledger-button-atom>
      <ledger-button-atom
        variant="icon-only"
        size="medium"
        icon
      ></ledger-button-atom>
    </div>
  `,
};

export const LargeButtons: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-button-atom
        label="Large Primary"
        variant="primary"
        size="large"
      ></ledger-button-atom>
      <ledger-button-atom
        label="Large Secondary"
        variant="secondary"
        size="large"
      ></ledger-button-atom>
      <ledger-button-atom
        variant="icon-only"
        size="large"
        icon
      ></ledger-button-atom>
    </div>
  `,
};

export const IconPositions: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-button-atom
        label="Left Icon"
        variant="icon-title"
        size="medium"
        icon
        icon-position="left"
      ></ledger-button-atom>
      <ledger-button-atom
        label="Right Icon"
        variant="icon-title"
        size="medium"
        icon
        icon-position="right"
      ></ledger-button-atom>
    </div>
  `,
};

export const DisabledStates: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-button-atom
        label="Disabled Primary"
        variant="primary"
        size="medium"
        ?disabled=${true}
      ></ledger-button-atom>
      <ledger-button-atom
        label="Disabled Secondary"
        variant="secondary"
        size="medium"
        ?disabled=${true}
      ></ledger-button-atom>
      <ledger-button-atom
        variant="icon-only"
        size="medium"
        icon
        ?disabled=${true}
      ></ledger-button-atom>
    </div>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #374151;"
        >
          Button Variants
        </h3>
        <div
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
        >
          <ledger-button-atom
            label="Primary"
            variant="primary"
            size="medium"
          ></ledger-button-atom>
          <ledger-button-atom
            label="Secondary"
            variant="secondary"
            size="medium"
          ></ledger-button-atom>
          <ledger-button-atom
            label="Select Button"
            variant="select-button"
            size="medium"
          ></ledger-button-atom>
          <ledger-button-atom
            label="Icon + Title"
            variant="icon-title"
            size="medium"
            icon
          ></ledger-button-atom>
          <ledger-button-atom
            variant="icon-only"
            size="medium"
            icon
          ></ledger-button-atom>
          <ledger-button-atom
            label="Title Only"
            variant="title-only"
            size="medium"
          ></ledger-button-atom>
        </div>
      </div>

      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #374151;"
        >
          Button Sizes
        </h3>
        <div
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
        >
          <ledger-button-atom
            label="Small"
            variant="primary"
            size="small"
          ></ledger-button-atom>
          <ledger-button-atom
            label="Medium"
            variant="primary"
            size="medium"
          ></ledger-button-atom>
          <ledger-button-atom
            label="Large"
            variant="primary"
            size="large"
          ></ledger-button-atom>
        </div>
      </div>

      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #374151;"
        >
          Button States
        </h3>
        <div
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
        >
          <ledger-button-atom
            label="Normal"
            variant="primary"
            size="medium"
          ></ledger-button-atom>
          <ledger-button-atom
            label="Disabled"
            variant="primary"
            size="medium"
            ?disabled=${true}
          ></ledger-button-atom>
        </div>
      </div>
    </div>
  `,
};
