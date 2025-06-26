import "./ledger-list-item-molecule";

import { expect, waitFor } from "@storybook/test";
import { userEvent } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";

const meta: Meta = {
  title: "Component/Molecule/ListItem",
  tags: ["autodocs"],
  render: (args) =>
    html`<div style="background: #272727; padding: 20px; width: 400px;">
      <ledger-list-item-molecule
        .variant=${args.variant || "connection"}
        .size=${args.size || "medium"}
        .title=${args.title || ""}
        .subtitle=${args.subtitle || ""}
        .amount=${args.amount || ""}
        .currency=${args.currency || ""}
        .iconType=${args.iconType || ""}
        .iconColor=${args.iconColor || ""}
        .clickable=${args.clickable ?? true}
        .disabled=${args.disabled ?? false}
        @list-item-click=${(e: CustomEvent) => {
          console.log("List item clicked:", e.detail);
        }}
      ></ledger-list-item-molecule>
    </div>`,
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
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
      description: "The size of the list item",
      table: {
        type: { summary: "small | medium | large" },
        defaultValue: { summary: "medium" },
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
      options: ["bluetooth", "usb", "ledger", "close", "chevron"],
      description: "The icon type to display",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '""' },
      },
    },
    iconColor: {
      control: { type: "select" },
      options: [
        "",
        "var(--color-crypto-ethereum)",
        "var(--color-crypto-bitcoin)",
        "var(--color-crypto-binance)",
        "var(--color-crypto-polygon)",
        "var(--color-crypto-cardano)",
        "var(--color-crypto-sol)",
        "var(--color-crypto-avax)",
        "var(--color-crypto-polkadot)",
        "var(--background-accent)",
        "var(--background-muted)",
        "var(--background-interactive)",
      ],
      description: "The background color token for account avatars",
      table: {
        type: { summary: "CSSBackgroundToken | CSSCryptoToken" },
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
    iconColor: "var(--color-crypto-ethereum)",
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
    iconColor: "var(--color-crypto-binance)",
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
    iconColor: "var(--color-crypto-polygon)",
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
    <div
      style="background: #272727; padding: 20px; display: flex; flex-direction: column; gap: 12px; width: 400px;"
    >
      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600; margin-top: 0;"
        >
          Connection Items
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-list-item-molecule
            variant="connection"
            title="Connect with Bluetooth"
            icon-type="bluetooth"
          ></ledger-list-item-molecule>
          <ledger-list-item-molecule
            variant="connection"
            title="Connect with USB"
            icon-type="usb"
          ></ledger-list-item-molecule>
        </div>
      </div>

      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          Account Items
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-list-item-molecule
            variant="account"
            title="john.eth"
            subtitle="0xC5...C0D8"
            amount="3.2343"
            currency="ETH"
            icon-color="var(--color-crypto-ethereum)"
          ></ledger-list-item-molecule>
          <ledger-list-item-molecule
            variant="account"
            title="BSC 1"
            subtitle="0x31...775D"
            amount="2304.3453"
            currency="BSC"
            icon-color="var(--color-crypto-binance)"
          ></ledger-list-item-molecule>
          <ledger-list-item-molecule
            variant="account"
            title="Polygon 1"
            subtitle="0x59...cEC9"
            amount="5432.3221"
            currency="POL"
            icon-color="var(--color-crypto-polygon)"
          ></ledger-list-item-molecule>
        </div>
      </div>

      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          States
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-list-item-molecule
            variant="connection"
            title="Disabled Connection"
            icon-type="bluetooth"
            disabled
          ></ledger-list-item-molecule>
          <ledger-list-item-molecule
            variant="account"
            title="Non-clickable Account"
            subtitle="0x12...34AB"
            amount="100.0"
            currency="ETH"
            icon-color="var(--color-crypto-ethereum)"
            clickable="false"
          ></ledger-list-item-molecule>
        </div>
      </div>

      <div>
        <h3
          style="color: white; margin-bottom: 8px; font-size: 14px; font-weight: 600;"
        >
          Sizes
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ledger-list-item-molecule
            variant="connection"
            title="Small Connection"
            icon-type="bluetooth"
            size="small"
          ></ledger-list-item-molecule>
          <ledger-list-item-molecule
            variant="connection"
            title="Medium Connection"
            icon-type="bluetooth"
            size="medium"
          ></ledger-list-item-molecule>
          <ledger-list-item-molecule
            variant="connection"
            title="Large Connection"
            icon-type="bluetooth"
            size="large"
          ></ledger-list-item-molecule>
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
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      expect(listItem).toBeInTheDocument();

      const container = listItem?.shadowRoot?.querySelector("button");
      expect(container).toBeInTheDocument();
    });

    await step("Verify title is displayed", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      const title = listItem?.shadowRoot?.querySelector(
        "[data-testid='title']",
      );

      expect(title).toBeInTheDocument();
      expect(title?.textContent?.trim()).toBe("Test Connection");
    });

    await step("Verify icon is present", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      const iconContainer = listItem?.shadowRoot?.querySelector(
        "[data-testid='connection-icon']",
      );
      const icon = iconContainer?.querySelector(
        "ledger-icon-atom[type='bluetooth']",
      );

      expect(iconContainer).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
    });

    await step("Verify chevron is present", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      const chevronContainer = listItem?.shadowRoot?.querySelector(
        "[data-testid='chevron']",
      );
      const chevron = chevronContainer?.querySelector(
        "ledger-icon-atom[type='chevron']",
      );

      expect(chevronContainer).toBeInTheDocument();
      expect(chevron).toBeInTheDocument();
    });

    await step("Verify click functionality", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
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
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
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
    iconColor: "var(--color-crypto-ethereum)",
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify account item renders correctly", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      expect(listItem).toBeInTheDocument();

      const container = listItem?.shadowRoot?.querySelector("button");
      expect(container).toBeInTheDocument();
    });

    await step("Verify title and subtitle are displayed", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
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
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      const amount = listItem?.shadowRoot?.querySelector(
        "[data-testid='amount']",
      );

      expect(amount).toBeInTheDocument();
      expect(amount?.textContent?.trim()).toBe("123.45 ETH");
    });

    await step("Verify avatar is present", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      const avatar = listItem?.shadowRoot?.querySelector(
        "[data-testid='account-avatar']",
      );

      expect(avatar).toBeInTheDocument();
      expect(avatar?.textContent?.trim()).toBe("TA"); // First letters of "Test Account"
    });

    await step("Verify no chevron for account variant", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      const chevronContainer = listItem?.shadowRoot?.querySelector(
        "[data-testid='chevron']",
      );

      expect(chevronContainer).not.toBeInTheDocument();
    });

    await step("Verify click functionality", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
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
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
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
    iconColor: "var(--color-crypto-ethereum)",
    clickable: false,
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify non-clickable item renders as div", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
      const container = listItem?.shadowRoot?.querySelector("div");
      const button = listItem?.shadowRoot?.querySelector("button");

      expect(container).toBeInTheDocument();
      expect(button).not.toBeInTheDocument();
    });

    await step("Verify no click events on non-clickable item", async () => {
      const listItem = canvasElement.querySelector("ledger-list-item-molecule");
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
