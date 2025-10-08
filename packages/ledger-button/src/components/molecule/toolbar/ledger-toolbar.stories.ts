import "./ledger-toolbar";

import { DeviceModelId } from "@ledgerhq/ledger-button-core";
import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";

import type { LedgerToolbarAttributes } from "./ledger-toolbar";

const meta: Meta<LedgerToolbarAttributes> = {
  title: "Component/Molecule/Toolbar",
  tags: ["autodocs"],
  render: (args) =>
    html`<div style="background: black;">
      <ledger-toolbar
        .title=${args.title || ""}
        .canGoBack=${args.canGoBack || false}
        @toolbar-close=${(e: CustomEvent) => {
          console.log("Toolbar close clicked:", e.detail);
        }}
      ></ledger-toolbar>
    </div>`,
  argTypes: {
    title: {
      control: "text",
      description: "The title text displayed in the toolbar",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '""' },
      },
    },
    deviceModelId: {
      control: "select",
      description: "The device model ID to display the corresponding icon",
      options: [
        DeviceModelId.FLEX,
        DeviceModelId.STAX,
        DeviceModelId.NANO_S,
        DeviceModelId.NANO_SP,
        DeviceModelId.NANO_X,
      ],
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "" },
      },
    },
    canGoBack: {
      control: "boolean",
      description: "Whether can go back to previous screen",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    canClose: {
      control: "boolean",
      description: "Whether can close the toolbar",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<LedgerToolbarAttributes>;

export const Default: Story = {
  args: {
    title: "Connect a Ledger",
    canGoBack: true,
  },
  parameters: {
    docs: {
      description: {
        story: "The default toolbar with logo, title, and close button.",
      },
    },
  },
};

export const AllVariations: Story = {
  render: () => {
    const handleToolbarChipClick = (e: CustomEvent) => {
      window.alert(`Chip clicked: ${JSON.stringify(e.detail)}`);
    };

    return html`
      <div
        style="background: black; padding: 20px; display: flex; flex-direction: column; gap: 16px;"
      >
        <div>
          <h3
            style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
          >
            With Title and no close button
          </h3>
          <ledger-toolbar
            title="Connect a Ledger"
            .showCloseButton=${false}
          ></ledger-toolbar>
        </div>

        <div>
          <h3
            style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
          >
            With Long Title
          </h3>
          <ledger-toolbar
            title="This is a very long title that demonstrates text handling"
          ></ledger-toolbar>
        </div>

        <div>
          <h3
            style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
          >
            Without Title
          </h3>
          <ledger-toolbar></ledger-toolbar>
        </div>

        <div>
          <h3
            style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
          >
            With Device Model ID = Flex
          </h3>
          <ledger-toolbar
            title="GM's Flex"
            deviceModelId=${DeviceModelId.FLEX}
            @ledger-toolbar-chip-click=${handleToolbarChipClick}
          ></ledger-toolbar>
        </div>

        <div>
          <h3
            style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
          >
            With Device Model ID = Stax
          </h3>
          <ledger-toolbar
            title="GM's Stax"
            deviceModelId=${DeviceModelId.STAX}
            @ledger-toolbar-chip-click=${handleToolbarChipClick}
          ></ledger-toolbar>
        </div>

        <div>
          <h3
            style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
          >
            With Device Model ID = Nano S
          </h3>
          <ledger-toolbar
            title="GM's Nano S"
            deviceModelId=${DeviceModelId.NANO_S}
            @ledger-toolbar-chip-click=${handleToolbarChipClick}
          ></ledger-toolbar>
        </div>

        <div>
          <h3
            style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
          >
            With Device Model ID = Nano SP
          </h3>
          <ledger-toolbar
            title="GM's Nano SP"
            deviceModelId=${DeviceModelId.NANO_SP}
            @ledger-toolbar-chip-click=${handleToolbarChipClick}
          ></ledger-toolbar>
        </div>

        <div>
          <h3
            style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
          >
            With Device Model ID = Nano X
          </h3>
          <ledger-toolbar
            title="GM's Nano X"
            deviceModelId=${DeviceModelId.NANO_X}
            @ledger-toolbar-chip-click=${handleToolbarChipClick}
          ></ledger-toolbar>
        </div>
      </div>
    `;
  },
};

export const TestToolbarInteractions: Story = {
  args: {
    title: "Test Toolbar",
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify toolbar renders correctly", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar");

      expect(toolbar).toBeInTheDocument();

      const container = toolbar?.shadowRoot?.querySelector(
        ".flex.items-center.justify-between",
      );

      expect(container).toBeInTheDocument();
    });

    await step("Verify title is displayed", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar");
      const title = toolbar?.shadowRoot?.querySelector("h2");

      expect(title).toBeInTheDocument();
      expect(title?.textContent?.trim()).toBe("Test Toolbar");
      expect(title?.tagName.toLowerCase()).toBe("h2");
    });

    await step("Verify logo is present", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar");
      const logoIcon = toolbar?.shadowRoot?.querySelector(
        "ledger-icon[type='ledger']",
      );

      expect(logoIcon).toBeInTheDocument();
    });

    await step("Verify close button functionality", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar");
      let closeEventFired = false;

      toolbar?.addEventListener("ledger-toolbar-close", () => {
        closeEventFired = true;
      });

      const closeIcon = toolbar?.shadowRoot?.querySelector(
        "ledger-button[iconType='close']",
      );

      if (closeIcon) {
        await userEvent.click(closeIcon as HTMLElement);
        await waitFor(() => {
          expect(closeEventFired).toBe(true);
        });
      }
    });

    await step("Verify accessibility attributes", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar");
      const title = toolbar?.shadowRoot?.querySelector("h2");
      expect(title).toHaveAttribute("class");
      expect(title?.tagName.toLowerCase()).toBe("h2");

      const logoIcon = toolbar?.shadowRoot?.querySelector(
        "ledger-icon[type='ledger']",
      );
      const closeIcon = toolbar?.shadowRoot?.querySelector("ledger-button");

      expect(logoIcon).toBeInTheDocument();
      expect(closeIcon).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Automated test story to verify toolbar functionality and interactions.",
      },
    },
  },
};
