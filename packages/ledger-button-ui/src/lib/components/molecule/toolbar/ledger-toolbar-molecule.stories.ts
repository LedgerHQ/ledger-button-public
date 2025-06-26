import "./ledger-toolbar-molecule";

import { expect, waitFor } from "@storybook/test";
import { userEvent } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";

import type { LedgerToolbarMoleculeAttributes } from "./ledger-toolbar-molecule";

const meta: Meta<LedgerToolbarMoleculeAttributes> = {
  title: "Component/Molecule/Toolbar",
  tags: ["autodocs"],
  render: (args) =>
    html`<div style="background: black; padding: 20px;">
      <ledger-toolbar-molecule
        .title=${args.title || ""}
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
  },
};

export default meta;
type Story = StoryObj<LedgerToolbarMoleculeAttributes>;

export const Default: Story = {
  args: {
    title: "Connect a Ledger",
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
  render: () => html`
    <div
      style="background: black; padding: 20px; display: flex; flex-direction: column; gap: 16px;"
    >
      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          With Title
        </h3>
        <ledger-toolbar-molecule
          title="Connect a Ledger"
        ></ledger-toolbar-molecule>
      </div>

      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          With Long Title
        </h3>
        <ledger-toolbar-molecule
          title="This is a very long title that demonstrates text handling"
        ></ledger-toolbar-molecule>
      </div>

      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          Without Title
        </h3>
        <ledger-toolbar-molecule></ledger-toolbar-molecule>
      </div>
    </div>
  `,
};

export const TestToolbarInteractions: Story = {
  args: {
    title: "Test Toolbar",
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify toolbar renders correctly", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar-molecule");

      expect(toolbar).toBeInTheDocument();

      const container = toolbar?.shadowRoot?.querySelector(
        ".flex.items-center.justify-between",
      );

      expect(container).toBeInTheDocument();
    });

    await step("Verify title is displayed", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar-molecule");
      const title = toolbar?.shadowRoot?.querySelector("h2");

      expect(title).toBeInTheDocument();
      expect(title?.textContent?.trim()).toBe("Test Toolbar");
      expect(title?.tagName.toLowerCase()).toBe("h2");
    });

    await step("Verify logo is present", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar-molecule");
      const logoIcon = toolbar?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='ledger']",
      );

      expect(logoIcon).toBeInTheDocument();
    });

    await step("Verify close button functionality", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar-molecule");
      let closeEventFired = false;

      toolbar?.addEventListener("toolbar-close", () => {
        closeEventFired = true;
      });

      const closeIcon = toolbar?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='close']",
      );

      if (closeIcon) {
        await userEvent.click(closeIcon as HTMLElement);
        await waitFor(() => {
          expect(closeEventFired).toBe(true);
        });
      }
    });

    await step("Verify accessibility attributes", async () => {
      const toolbar = canvasElement.querySelector("ledger-toolbar-molecule");
      const title = toolbar?.shadowRoot?.querySelector("h2");
      expect(title).toHaveAttribute("class");
      expect(title?.tagName.toLowerCase()).toBe("h2");

      const logoIcon = toolbar?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='ledger']",
      );
      const closeIcon = toolbar?.shadowRoot?.querySelector(
        "ledger-icon-atom[type='close']",
      );

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
