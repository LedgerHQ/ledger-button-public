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
      .size=${args.size || "medium"}
      .icon=${args.icon || "ledger"}
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
    size: {
      control: "select",
      options: ["small", "medium", "large"],
      description: "The size of the chip",
    },
    disabled: {
      control: "boolean",
      description: "Whether the chip is disabled",
    },
    icon: {
      control: "select",
      options: [
        "ledger",
        "bluetooth",
        "usb",
        "ethereum",
        "bsc",
        "polygon",
        "check",
        "error",
      ],
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
    size: "medium",
    icon: "ledger",
    disabled: false,
  },
};

export const Selected: Story = {
  args: {
    label: "GM's Flex",
    variant: "selected",
    size: "medium",
    icon: "ledger",
    disabled: false,
  },
};

export const WithDifferentIcons: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-chip-atom
        label="Ledger Device"
        icon="ledger"
        variant="default"
        size="medium"
      ></ledger-chip-atom>
      <ledger-chip-atom
        label="Bluetooth"
        icon="bluetooth"
        variant="default"
        size="medium"
      ></ledger-chip-atom>
      <ledger-chip-atom
        label="USB Connection"
        icon="usb"
        variant="default"
        size="medium"
      ></ledger-chip-atom>
      <ledger-chip-atom
        label="Ethereum"
        icon="ethereum"
        variant="default"
        size="medium"
      ></ledger-chip-atom>
    </div>
  `,
};

export const AllSizes: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-chip-atom
        label="Small Chip"
        variant="default"
        size="small"
        icon="ledger"
      ></ledger-chip-atom>
      <ledger-chip-atom
        label="Medium Chip"
        variant="default"
        size="medium"
        icon="ledger"
      ></ledger-chip-atom>
      <ledger-chip-atom
        label="Large Chip"
        variant="default"
        size="large"
        icon="ledger"
      ></ledger-chip-atom>
    </div>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-chip-atom
        label="Default Chip"
        variant="default"
        size="medium"
        icon="ledger"
      ></ledger-chip-atom>
      <ledger-chip-atom
        label="Selected Chip"
        variant="selected"
        size="medium"
        icon="ledger"
      ></ledger-chip-atom>
    </div>
  `,
};

export const DisabledStates: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
    >
      <ledger-chip-atom
        label="Disabled Default"
        variant="default"
        size="medium"
        icon="ledger"
        ?disabled=${true}
      ></ledger-chip-atom>
      <ledger-chip-atom
        label="Disabled Selected"
        variant="selected"
        size="medium"
        icon="ledger"
        ?disabled=${true}
      ></ledger-chip-atom>
    </div>
  `,
};

export const LongTextHandling: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 12px; max-width: 300px;"
    >
      <ledger-chip-atom
        label="Very Long Device Name That Should Truncate"
        variant="default"
        size="medium"
        icon="ledger"
      ></ledger-chip-atom>
      <ledger-chip-atom
        label="Another Really Long Device Name Here"
        variant="selected"
        size="small"
        icon="bluetooth"
      ></ledger-chip-atom>
    </div>
  `,
};

export const DeviceSelectionExample: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 8px; max-width: 400px;"
    >
      <h3
        style="margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #374151;"
      >
        Device Selection Example
      </h3>
      <ledger-chip-atom
        label="GM's Flex"
        variant="selected"
        size="medium"
        icon="ledger"
      ></ledger-chip-atom>
      <p style="font-size: 12px; color: #6B7280; margin-top: 8px;">
        This chip would be used in the toolbar to show the currently selected
        device. Clicking it would open a device selection modal.
      </p>
    </div>
  `,
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
          size="medium"
          icon="ledger"
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

export const AllSizesComparison: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #374151;"
        >
          Size Comparison - Default Variant
        </h3>
        <div
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
        >
          <ledger-chip-atom
            label="Small"
            variant="default"
            size="small"
            icon="ledger"
          ></ledger-chip-atom>
          <ledger-chip-atom
            label="Medium"
            variant="default"
            size="medium"
            icon="ledger"
          ></ledger-chip-atom>
          <ledger-chip-atom
            label="Large"
            variant="default"
            size="large"
            icon="ledger"
          ></ledger-chip-atom>
        </div>
      </div>

      <div>
        <h3
          style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #374151;"
        >
          Size Comparison - Selected Variant
        </h3>
        <div
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;"
        >
          <ledger-chip-atom
            label="Small"
            variant="selected"
            size="small"
            icon="ledger"
          ></ledger-chip-atom>
          <ledger-chip-atom
            label="Medium"
            variant="selected"
            size="medium"
            icon="ledger"
          ></ledger-chip-atom>
          <ledger-chip-atom
            label="Large"
            variant="selected"
            size="large"
            icon="ledger"
          ></ledger-chip-atom>
        </div>
      </div>
    </div>
  `,
};

export const ToolbarIntegrationExample: Story = {
  render: () => html`
    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px;">
      <h3
        style="color: white; margin-bottom: 16px; font-size: 14px; font-weight: 600;"
      >
        Toolbar Integration Example
      </h3>
      <div
        style="background: black; border-radius: 12px; padding: 0; overflow: hidden;"
      >
        <div class="w-full flex items-center justify-between p-16">
          <div class="h-20 w-20">
            <ledger-icon-atom type="ledger" size="medium"></ledger-icon-atom>
          </div>
          <ledger-chip-atom
            label="GM's Flex"
            variant="default"
            size="medium"
            icon="ledger"
            @ledger-chip-click=${(e: CustomEvent) => {
              console.log("Device selector clicked:", e.detail);
            }}
          ></ledger-chip-atom>
          <div class="h-20 w-20 cursor-pointer">
            <ledger-icon-atom type="close" size="large"></ledger-icon-atom>
          </div>
        </div>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 12px;">
        This shows how the Chip atom replaces the title in the toolbar molecule.
        The chip displays the currently selected device and can be clicked to
        open a device selection modal.
      </p>
    </div>
  `,
};

export const TestChipInteractions: Story = {
  args: {
    label: "Test Chip",
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify chip renders correctly", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");

      expect(chip).toBeInTheDocument();

      const chipContainer = chip?.shadowRoot?.querySelector(".chip-container");

      expect(chipContainer).toBeInTheDocument();
    });

    await step("Verify label is displayed", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");
      const label = chip?.shadowRoot?.querySelector(".chip-label");

      expect(label).toBeInTheDocument();
      expect(label?.textContent?.trim()).toBe("Test Chip");
    });

    await step("Verify icon and chevron are present", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");
      const iconElement = chip?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='ledger']",
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

      const chipContainer = chip?.shadowRoot?.querySelector(".chip-container");

      if (chipContainer) {
        await userEvent.click(chipContainer as HTMLElement);
        await waitFor(() => {
          expect(clickEventFired).toBe(true);
        });
      }
    });

    await step("Verify accessibility attributes", async () => {
      const chip = canvasElement.querySelector("ledger-chip-atom");
      const chipContainer = chip?.shadowRoot?.querySelector(".chip-container");
      expect(chipContainer).toHaveAttribute("role", "button");
      expect(chipContainer).toHaveAttribute("aria-label", "Test Chip");

      const iconElement = chip?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='ledger']",
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

export const CompleteUsageExample: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div>
        <h3
          style="margin-bottom: 16px; font-size: 16px; font-weight: 600; color: #374151;"
        >
          Complete Usage Examples
        </h3>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <h4
              style="margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #6B7280;"
            >
              Device Selection States
            </h4>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <ledger-chip-atom
                label="No Device Selected"
                variant="default"
                size="medium"
                icon="error"
              ></ledger-chip-atom>
              <ledger-chip-atom
                label="GM's Flex"
                variant="selected"
                size="medium"
                icon="ledger"
              ></ledger-chip-atom>
              <ledger-chip-atom
                label="Connecting..."
                variant="default"
                size="medium"
                icon="bluetooth"
                ?disabled=${true}
              ></ledger-chip-atom>
            </div>
          </div>

          <div>
            <h4
              style="margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #6B7280;"
            >
              Connection Types
            </h4>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <ledger-chip-atom
                label="Nano S Plus (USB)"
                variant="selected"
                size="medium"
                icon="usb"
              ></ledger-chip-atom>
              <ledger-chip-atom
                label="Nano X (Bluetooth)"
                variant="default"
                size="medium"
                icon="bluetooth"
              ></ledger-chip-atom>
              <ledger-chip-atom
                label="Stax (USB-C)"
                variant="default"
                size="medium"
                icon="usb"
              ></ledger-chip-atom>
            </div>
          </div>

          <div>
            <h4
              style="margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #6B7280;"
            >
              Network Selection
            </h4>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <ledger-chip-atom
                label="Ethereum"
                variant="selected"
                size="small"
                icon="ethereum"
              ></ledger-chip-atom>
              <ledger-chip-atom
                label="BSC"
                variant="default"
                size="small"
                icon="bsc"
              ></ledger-chip-atom>
              <ledger-chip-atom
                label="Polygon"
                variant="default"
                size="small"
                icon="polygon"
              ></ledger-chip-atom>
            </div>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
        <h4
          style="margin-bottom: 12px; font-size: 14px; font-weight: 500; color: #6B7280;"
        >
          Implementation Notes
        </h4>
        <ul
          style="font-size: 12px; color: #6B7280; line-height: 1.5; margin: 0; padding-left: 20px;"
        >
          <li>Chips emit 'ledger-chip-click' events when clicked</li>
          <li>
            Use 'selected' variant to indicate the currently active choice
          </li>
          <li>Icons should match the context (device type, network, etc.)</li>
          <li>The chevron icon is automatically rotated and styled</li>
          <li>Disabled state prevents interaction and reduces opacity</li>
          <li>
            Keyboard navigation (Enter/Space) is supported for accessibility
          </li>
        </ul>
      </div>
    </div>
  `,
};
