import "./ledger-chip";
import "../icon/ledger-icon";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";

const meta: Meta = {
  title: "Component/Atom/Chip",
  tags: ["autodocs"],
  render: (args) =>
    html`<ledger-chip
      .label=${args.label || ""}
      .icon=${args.icon || "device"}
      @ledger-chip-click=${(e: CustomEvent) => {
        console.log("Chip clicked:", e.detail);
      }}
    ></ledger-chip>`,
  argTypes: {
    label: {
      control: "text",
      description: "The text displayed on the chip",
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
  },
};

export const Selected: Story = {
  args: {
    label: "GM's Flex",
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
        <ledger-chip
          label=${selectedDevice}
          @ledger-chip-click=${handleChipClick}
        ></ledger-chip>
        <p style="font-size: 12px; color: #6B7280;">
          Click the chip above to see it cycle through different device names.
          In a real implementation, this would open a device selection list in
          the modal.
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
      const chip = canvasElement.querySelector("ledger-chip");

      expect(chip).toBeInTheDocument();

      const chipContainer = chip?.shadowRoot?.querySelector("button");

      expect(chipContainer).toBeInTheDocument();
    });

    await step("Verify label is displayed", async () => {
      const chip = canvasElement.querySelector("ledger-chip");
      const label = chip?.shadowRoot?.querySelector("span");

      expect(label).toBeInTheDocument();
      expect(label?.textContent?.trim()).toBe("Test Chip");
    });

    await step("Verify icon and chevron are present", async () => {
      const chip = canvasElement.querySelector("ledger-chip");
      const iconElement = chip?.shadowRoot?.querySelector(
        "ledger-icon[type='device']",
      );
      const chevronElement = chip?.shadowRoot?.querySelector(
        "ledger-icon[type='chevron']",
      );

      expect(iconElement).toBeInTheDocument();
      expect(chevronElement).toBeInTheDocument();
    });

    await step("Verify click functionality", async () => {
      const chip = canvasElement.querySelector("ledger-chip");
      let clickEventFired = false;

      chip?.addEventListener("ledger-chip-click", () => {
        clickEventFired = true;
      });

      const chipContainer = chip?.shadowRoot?.querySelector("button");

      if (chipContainer) {
        await userEvent.click(chipContainer as HTMLElement);
        await waitFor(() => {
          expect(clickEventFired).toBe(true);
        });
      }
    });

    await step("Verify accessibility attributes", async () => {
      const chip = canvasElement.querySelector("ledger-chip");
      const chipContainer = chip?.shadowRoot?.querySelector("button");
      expect(chipContainer).toHaveAttribute("aria-label", "Test Chip");

      const iconElement = chip?.shadowRoot?.querySelector(
        "ledger-icon[type='device']",
      );
      const chevronElement = chip?.shadowRoot?.querySelector(
        "ledger-icon[type='chevron']",
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
