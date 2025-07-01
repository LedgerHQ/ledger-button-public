import "./ledger-chip-atom";
import "../icon/ledger-icon-atom";

import { expect, waitFor } from "@storybook/test";
import { userEvent } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";

const meta: Meta = {
  title: "Component/Atom/Chip",
  tags: ["autodocs"],
  render: (args) =>
    html`<ledger-chip-atom
      .label=${args.label || ""}
      .variant=${args.variant || "default"}
      .icon=${args.icon || "device"}
      ?disabled=${args.disabled}
      @ledger-chip-click=${(e: CustomEvent) => {
        console.log("Chip clicked:", e.detail);
      }}
    ></ledger-chip-atom>`,
  argTypes: {
    label: {
      control: "text",
      description: "The text displayed on the chip",
    },
    variant: {
      control: "select",
      options: ["default", "selected"],
      description: "The variant of the chip",
    },
    disabled: {
      control: "boolean",
      description: "Whether the chip is disabled",
    },
    icon: {
      control: "select",
      options: ["device"],
      description: "The icon to display on the left side of the chip",
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    label: "GM's Flex",
    variant: "default",
    disabled: false,
  },
};

export const Selected: Story = {
  args: {
    label: "GM's Flex",
    variant: "selected",
    disabled: false,
  },
};

export const InteractiveExample: Story = {
  render: () => {
    let selectedDevice = "GM's Flex";
    const devices = [
      "GM's Flex",
      "John's Nano S",
      "Sarah's Nano X",
      "Dev Device",
    ];

    const handleChipClick = (e: CustomEvent) => {
      const currentIndex = devices.indexOf(selectedDevice);
      const nextIndex = (currentIndex + 1) % devices.length;
      selectedDevice = devices[nextIndex];

      const chipElement = e.target as any;
      chipElement.label = selectedDevice;

      console.log("Device changed to:", selectedDevice);
    };

    return html`
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h3
          style="margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #374151;"
        >
          Interactive Chip (Click to cycle through devices)
        </h3>
        <ledger-chip-atom
          label=${selectedDevice}
          variant="selected"
          @ledger-chip-click=${handleChipClick}
        ></ledger-chip-atom>
        <p style="font-size: 12px; color: #6B7280;">
          Click the chip above to see it cycle through different device names.
          In a real implementation, this would open a device selection modal.
        </p>
      </div>
    `;
  },
};

export const TestChipInteractions: Story = {
  args: {
    label: "Test Chip",
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify chip renders correctly", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");

      expect(chip).toBeInTheDocument();

      const chipContainer = chip?.shadowRoot?.querySelector(
        "div > div[role='button']",
      );

      expect(chipContainer).toBeInTheDocument();
    });

    await step("Verify label is displayed", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");
      const label = chip?.shadowRoot?.querySelector("span");

      expect(label).toBeInTheDocument();
      expect(label?.textContent?.trim()).toBe("Test Chip");
    });

    await step("Verify icon and chevron are present", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");
      const iconElement = chip?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='device']",
      );
      const chevronElement = chip?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='chevron']",
      );

      expect(iconElement).toBeInTheDocument();
      expect(chevronElement).toBeInTheDocument();
    });

    await step("Verify click functionality", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");
      let clickEventFired = false;

      chip?.addEventListener("ledger-chip-click", () => {
        clickEventFired = true;
      });

      const chipContainer = chip?.shadowRoot?.querySelector(
        "div > div[role='button']",
      );

      if (chipContainer) {
        await userEvent.click(chipContainer as HTMLElement);
        await waitFor(() => {
          expect(clickEventFired).toBe(true);
        });
      }
    });

    await step("Verify accessibility attributes", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");
      const chipContainer = chip?.shadowRoot?.querySelector(
        "div > div[role='button']",
      );
      expect(chipContainer).toHaveAttribute("role", "button");
      expect(chipContainer).toHaveAttribute("aria-label", "Test Chip");

      const iconElement = chip?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='device']",
      );
      const chevronElement = chip?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='chevron']",
      );

      expect(iconElement).toBeInTheDocument();
      expect(chevronElement).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Automated test story to verify chip functionality and interactions.",
      },
    },
  },
};
