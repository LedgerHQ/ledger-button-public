import "./ledger-toolbar-molecule";

import { expect, waitFor } from "@storybook/test";
import { userEvent } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { within as shadowWithin } from "shadow-dom-testing-library";

import type { LedgerToolbarMoleculeAttributes } from "./ledger-toolbar-molecule";

const meta: Meta<LedgerToolbarMoleculeAttributes> = {
  title: "Component/Molecule/Toolbar",
  tags: ["autodocs"],
  render: (args) =>
    html`<div style="background: black; padding: 20px;">
      <ledger-toolbar-molecule
        .title=${args.title || ""}
        ?show-close=${args.showClose}
        ?show-logo=${args.showLogo}
        @toolbar-close=${(e: CustomEvent) => {
          console.log("Toolbar close clicked:", e.detail);
        }}
      ></ledger-toolbar-molecule>
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
    showClose: {
      control: "boolean",
      description: "Whether to show the close button",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    showLogo: {
      control: "boolean",
      description: "Whether to show the Ledger logo",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<LedgerToolbarMoleculeAttributes>;

export const Default: Story = {
  args: {
    title: "Connect a Ledger",
    showClose: true,
    showLogo: true,
  },
  parameters: {
    docs: {
      description: {
        story: "The default toolbar with logo, title, and close button.",
      },
    },
  },
};

export const WithoutLogo: Story = {
  args: {
    title: "Settings",
    showClose: true,
    showLogo: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Toolbar without the Ledger logo, useful for secondary screens.",
      },
    },
  },
};

export const WithoutCloseButton: Story = {
  args: {
    title: "Welcome",
    showClose: false,
    showLogo: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Toolbar without close button, useful for non-dismissible contexts.",
      },
    },
  },
};

export const MinimalToolbar: Story = {
  args: {
    title: "Minimal",
    showClose: false,
    showLogo: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Minimal toolbar with only the title text.",
      },
    },
  },
};

export const LongTitleExample: Story = {
  args: {
    title: "This is a very long title that demonstrates text handling",
    showClose: true,
    showLogo: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Example with a longer title to test text handling and layout.",
      },
    },
  },
};

export const AllVariations: Story = {
  render: () => html`
    <div
      style="background: black; padding: 20px; display: flex; flex-direction: column; gap: 16px;"
    >
      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          Complete Toolbar (Default)
        </h3>
        <ledger-toolbar-molecule
          title="Connect a Ledger"
          show-close
          show-logo
        ></ledger-toolbar-molecule>
      </div>

      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          Without Logo
        </h3>
        <ledger-toolbar-molecule
          title="Settings"
          show-close
        ></ledger-toolbar-molecule>
      </div>

      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          Without Close Button
        </h3>
        <ledger-toolbar-molecule
          title="Welcome"
          show-logo
        ></ledger-toolbar-molecule>
      </div>

      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          Title Only
        </h3>
        <ledger-toolbar-molecule title="Minimal"></ledger-toolbar-molecule>
      </div>
    </div>
  `,
};

export const TestToolbarInteractions: Story = {
  args: {
    title: "Test Toolbar",
    showClose: true,
    showLogo: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = shadowWithin(canvasElement);

    await step("Verify toolbar renders correctly", async () => {
      const toolbar = canvas.getByRole("generic");

      expect(toolbar).toBeInTheDocument();
    });

    await step("Verify title is displayed", async () => {
      const title = canvas.getByText("Test Toolbar");

      expect(title).toBeInTheDocument();
      expect(title.tagName.toLowerCase()).toBe("h2");
    });

    await step("Verify logo is present when showLogo is true", async () => {
      const logoContainer = canvas.getByRole("img");

      expect(logoContainer).toBeInTheDocument();
    });

    await step("Verify close button functionality", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar-molecule");
      let closeEventFired = false;

      toolbar?.addEventListener("toolbar-close", () => {
        closeEventFired = true;
      });

      const closeIcons = canvas.getAllByRole("img");
      const closeIcon = closeIcons.find(
        (icon) =>
          icon.getAttribute("type") === "close" ||
          icon.closest("ledger-icon-atom")?.getAttribute("type") === "close",
      );

      if (closeIcon) {
        await userEvent.click(closeIcon);
        await waitFor(() => {
          expect(closeEventFired).toBe(true);
        });
      }
    });

    await step("Verify accessibility attributes", async () => {
      const title = canvas.getByText("Test Toolbar");
      expect(title).toHaveAttribute("class");

      const logoIcons = canvas.getAllByRole("img");
      expect(logoIcons.length).toBeGreaterThan(0);
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
