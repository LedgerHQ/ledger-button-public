import "./ledger-list-item";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";

const meta: Meta = {
  title: "Component/Molecule/ListItem",
  tags: ["autodocs"],
  render: (args) => html`
    <ledger-list-item
      .variant=${args.variant || "connection"}
      .title=${args.title || ""}
      .subtitle=${args.subtitle || ""}
      .amount=${args.amount || ""}
      .currency=${args.currency || ""}
      .iconType=${args.iconType || ""}
      .clickable=${args.clickable ?? true}
      .disabled=${args.disabled ?? false}
      @list-item-click=${(e: CustomEvent) => {
        console.log("List item clicked:", e.detail);
      }}
    ></ledger-list-item>
  `,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["connection", "account"],
      description: "The variant of the list item",
      table: {
        type: { summary: "connection | account" },
        defaultValue: { summary: "connection" },
      },
    },
    title: {
      control: "text",
      description: "The main title text",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '""' },
      },
    },
    subtitle: {
      control: "text",
      description: "The subtitle text (shown for account variant)",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '""' },
      },
    },
    amount: {
      control: "text",
      description: "The amount to display (for account variant)",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '""' },
      },
    },
    currency: {
      control: "text",
      description: "The currency code or symbol",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '""' },
      },
    },
    iconType: {
      control: { type: "select" },
      options: [
        "",
        "bluetooth",
        "usb",
        "ledger",
        "close",
        "chevron",
        "ethereum",
        "bsc",
        "polygon",
      ],
      description:
        "The icon type to display. For connection items: bluetooth, usb. For account items: ethereum, bsc, polygon",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '""' },
      },
    },
    clickable: {
      control: "boolean",
      description: "Whether the item is clickable",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the item is disabled",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ConnectionBluetooth: Story = {
  args: {
    variant: "connection",
    title: "Connect with Bluetooth",
    iconType: "bluetooth",
  },
  parameters: {
    docs: {
      description: {
        story: "Connection list item with Bluetooth icon.",
      },
    },
  },
};

export const ConnectionUSB: Story = {
  args: {
    variant: "connection",
    title: "Connect with USB",
    iconType: "usb",
  },
  parameters: {
    docs: {
      description: {
        story: "Connection list item with USB icon.",
      },
    },
  },
};

export const AccountEthereum: Story = {
  args: {
    variant: "account",
    title: "john.eth",
    subtitle: "0xC5...C0D8",
    amount: "3.2343",
    currency: "ETH",
    iconType: "ethereum",
  },
  parameters: {
    docs: {
      description: {
        story: "Account list item for Ethereum wallet.",
      },
    },
  },
};

export const AccountBSC: Story = {
  args: {
    variant: "account",
    title: "BSC 1",
    subtitle: "0x31...775D",
    amount: "2304.3453",
    currency: "BSC",
    iconType: "bsc",
  },
  parameters: {
    docs: {
      description: {
        story: "Account list item for BSC wallet.",
      },
    },
  },
};

export const AccountPolygon: Story = {
  args: {
    variant: "account",
    title: "Polygon 1",
    subtitle: "0x59...cEC9",
    amount: "5432.3221",
    currency: "POL",
    iconType: "polygon",
  },
  parameters: {
    docs: {
      description: {
        story: "Account list item for Polygon wallet.",
      },
    },
  },
};

export const AllVariations: Story = {
  render: () => html`
    <div>
      <div>
        <h3
          style="margin-bottom: 8px; font-size: 14px; font-weight: 600; margin-top: 0;"
        >
          Connection Items
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-list-item
            variant="connection"
            title="Connect with Bluetooth"
            icon-type="bluetooth"
          ></ledger-list-item>
          <ledger-list-item
            variant="connection"
            title="Connect with USB"
            icon-type="usb"
          ></ledger-list-item>
        </div>
      </div>

      <div>
        <h3 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          Account Items
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-list-item
            variant="account"
            title="john.eth"
            subtitle="0xC5...C0D8"
            amount="3.2343"
            currency="ETH"
            icon-type="ethereum"
          ></ledger-list-item>
          <ledger-list-item
            variant="account"
            title="BSC 1"
            subtitle="0x31...775D"
            amount="2304.3453"
            currency="BSC"
            icon-type="bsc"
          ></ledger-list-item>
          <ledger-list-item
            variant="account"
            title="Polygon 1"
            subtitle="0x59...cEC9"
            amount="5432.3221"
            currency="POL"
            icon-type="polygon"
          ></ledger-list-item>
        </div>
      </div>

      <div>
        <h3 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          States
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-list-item
            variant="connection"
            title="Disabled Connection"
            icon-type="bluetooth"
            disabled
          ></ledger-list-item>
          <ledger-list-item
            variant="account"
            title="Non-clickable Account"
            subtitle="0x12...34AB"
            amount="100.0"
            currency="ETH"
            icon-type="ethereum"
            .clickable=${false}
          ></ledger-list-item>
        </div>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: "Overview of all list item variations and states.",
      },
    },
  },
};

export const TestConnectionInteractions: Story = {
  args: {
    variant: "connection",
    title: "Test Connection",
    iconType: "bluetooth",
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify connection item renders correctly", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      expect(listItem).toBeInTheDocument();

      const container = listItem?.shadowRoot?.querySelector("button");
      expect(container).toBeInTheDocument();
    });

    await step("Verify title is displayed", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const title = listItem?.shadowRoot?.querySelector(
        "[data-testid='title']",
      );

      expect(title).toBeInTheDocument();
      expect(title?.textContent?.trim()).toBe("Test Connection");
    });

    await step("Verify icon is present", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const iconContainer = listItem?.shadowRoot?.querySelector(
        "[data-testid='connection-icon']",
      );
      const icon = iconContainer?.querySelector(
        "ledger-icon[type='bluetooth']",
      );

      expect(iconContainer).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
    });

    await step("Verify chevron is present", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const chevronContainer = listItem?.shadowRoot?.querySelector(
        "[data-testid='chevron']",
      );
      const chevron = chevronContainer?.querySelector(
        "ledger-icon[type='chevron']",
      );

      expect(chevronContainer).toBeInTheDocument();
      expect(chevron).toBeInTheDocument();
    });

    await step("Verify click functionality", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      let clickEventFired = false;

      listItem?.addEventListener("list-item-click", (e: Event) => {
        const customEvent = e as CustomEvent;
        clickEventFired = true;
        expect(customEvent.detail.variant).toBe("connection");
        expect(customEvent.detail.title).toBe("Test Connection");
      });

      const button = listItem?.shadowRoot?.querySelector("button");
      if (button) {
        await userEvent.click(button);
        await waitFor(() => {
          expect(clickEventFired).toBe(true);
        });
      }
    });

    await step("Verify keyboard navigation", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      let keyboardEventFired = false;

      listItem?.addEventListener("list-item-click", () => {
        keyboardEventFired = true;
      });

      const button = listItem?.shadowRoot?.querySelector("button");
      if (button) {
        button.focus();
        await userEvent.keyboard("{Enter}");
        await waitFor(() => {
          expect(keyboardEventFired).toBe(true);
        });
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Automated test story to verify connection item functionality.",
      },
    },
  },
};

export const TestAccountInteractions: Story = {
  args: {
    variant: "account",
    title: "Test Account",
    subtitle: "0x12...34AB",
    amount: "123.45",
    currency: "ETH",
    iconType: "ethereum",
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify account item renders correctly", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      expect(listItem).toBeInTheDocument();

      const container = listItem?.shadowRoot?.querySelector("button");
      expect(container).toBeInTheDocument();
    });

    await step("Verify title and subtitle are displayed", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const title = listItem?.shadowRoot?.querySelector(
        "[data-testid='title']",
      );
      const subtitle = listItem?.shadowRoot?.querySelector(
        "[data-testid='subtitle']",
      );

      expect(title).toBeInTheDocument();
      expect(title?.textContent?.trim()).toBe("Test Account");
      expect(subtitle).toBeInTheDocument();
      expect(subtitle?.textContent?.trim()).toBe("0x12...34AB");
    });

    await step("Verify amount is displayed", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const amount = listItem?.shadowRoot?.querySelector(
        "[data-testid='amount']",
      );

      expect(amount).toBeInTheDocument();
      expect(amount?.textContent?.trim()).toBe("123.45 ETH");
    });

    await step("Verify avatar is present", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const avatar = listItem?.shadowRoot?.querySelector(
        "[data-testid='account-avatar']",
      );

      expect(avatar).toBeInTheDocument();
      const icon = avatar?.querySelector("ledger-icon[type='ethereum']");
      expect(icon).toBeInTheDocument();
    });

    await step("Verify no chevron for account variant", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const chevronContainer = listItem?.shadowRoot?.querySelector(
        "[data-testid='chevron']",
      );

      expect(chevronContainer).not.toBeInTheDocument();
    });

    await step("Verify click functionality", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      let clickEventFired = false;

      listItem?.addEventListener("list-item-click", (e: Event) => {
        const customEvent = e as CustomEvent;
        clickEventFired = true;
        expect(customEvent.detail.variant).toBe("account");
        expect(customEvent.detail.title).toBe("Test Account");
        expect(customEvent.detail.amount).toBe("123.45");
        expect(customEvent.detail.currency).toBe("ETH");
      });

      const button = listItem?.shadowRoot?.querySelector("button");
      if (button) {
        await userEvent.click(button);
        await waitFor(() => {
          expect(clickEventFired).toBe(true);
        });
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Automated test story to verify account item functionality.",
      },
    },
  },
};

export const TestDisabledState: Story = {
  args: {
    variant: "connection",
    title: "Disabled Item",
    iconType: "bluetooth",
    disabled: true,
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify disabled styling", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const button = listItem?.shadowRoot?.querySelector("button");

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("disabled");
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Test story to verify disabled state functionality.",
      },
    },
  },
};

export const TestNonClickable: Story = {
  args: {
    variant: "account",
    title: "Non-clickable Item",
    subtitle: "0x12...34AB",
    amount: "100.0",
    currency: "ETH",
    iconType: "ethereum",
    clickable: false,
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify non-clickable item renders as div", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      const container = listItem?.shadowRoot?.querySelector("div");
      const button = listItem?.shadowRoot?.querySelector("button");

      expect(container).toBeInTheDocument();
      expect(button).not.toBeInTheDocument();
    });

    await step("Verify no click events on non-clickable item", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item");
      let clickEventFired = false;

      listItem?.addEventListener("list-item-click", () => {
        clickEventFired = true;
      });

      const container = listItem?.shadowRoot?.querySelector("div");
      if (container) {
        await userEvent.click(container);
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(clickEventFired).toBe(false);
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Test story to verify non-clickable state functionality.",
      },
    },
  },
};
