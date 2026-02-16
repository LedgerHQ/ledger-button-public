import "../icon/ledger-icon";
import "./ledger-search-input";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { expect, userEvent, waitFor } from "storybook/test";

import type { LedgerSearchInputAttributes } from "./ledger-search-input";

const meta: Meta<LedgerSearchInputAttributes> = {
  title: "Component/Atom/SearchInput",
  tags: ["autodocs"],
  render: (args) => html`
    <div style="max-width: 400px;">
      <ledger-search-input
        .placeholder=${args.placeholder || "Search account"}
        .value=${args.value || ""}
        ?disabled=${args.disabled}
        @search-input-change=${(e: CustomEvent) => {
          console.log("search-input-change:", e.detail);
        }}
        @search-input-clear=${() => {
          console.log("search-input-clear");
        }}
      ></ledger-search-input>
    </div>
  `,
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text displayed when input is empty",
    },
    value: {
      control: "text",
      description: "Current value of the search input",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<LedgerSearchInputAttributes>;

export const Empty: Story = {
  args: {
    placeholder: "Search account",
    value: "",
    disabled: false,
  },
};

export const WithValue: Story = {
  args: {
    placeholder: "Search account",
    value: "john",
    disabled: false,
  },
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: "Search tokens...",
    value: "",
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Search account",
    value: "",
    disabled: true,
  },
};

export const DisabledWithValue: Story = {
  args: {
    placeholder: "Search account",
    value: "john",
    disabled: true,
  },
};

export const AllStates: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 20px; max-width: 400px;"
    >
      <div>
        <h3 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          Empty State
        </h3>
        <ledger-search-input
          placeholder="Search account"
        ></ledger-search-input>
      </div>
      <div>
        <h3 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          With Value
        </h3>
        <ledger-search-input
          placeholder="Search account"
          value="john"
        ></ledger-search-input>
      </div>
      <div>
        <h3 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          Custom Placeholder
        </h3>
        <ledger-search-input
          placeholder="Search tokens..."
        ></ledger-search-input>
      </div>
      <div>
        <h3 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          Disabled
        </h3>
        <ledger-search-input
          placeholder="Search account"
          disabled
        ></ledger-search-input>
      </div>
      <div>
        <h3 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          Disabled With Value
        </h3>
        <ledger-search-input
          placeholder="Search account"
          value="john"
          disabled
        ></ledger-search-input>
      </div>
    </div>
  `,
};

export const TestSearchInputInteractions: Story = {
  args: {
    placeholder: "Search account",
    value: "",
    disabled: false,
  },
  play: async ({ canvasElement, step }) => {
    await step("Verify component renders correctly", async () => {
      const searchInput = canvasElement.querySelector("ledger-search-input");
      expect(searchInput).toBeInTheDocument();

      const input = searchInput?.shadowRoot?.querySelector("input");
      expect(input).toBeInTheDocument();
    });

    await step("Verify search icon is present", async () => {
      const searchInput = canvasElement.querySelector("ledger-search-input");
      const icon = searchInput?.shadowRoot?.querySelector("ledger-icon");
      expect(icon).toBeInTheDocument();
    });

    await step("Verify clear button is hidden when empty", async () => {
      const searchInput = canvasElement.querySelector("ledger-search-input");
      const clearButton = searchInput?.shadowRoot?.querySelector("button");
      expect(clearButton).not.toBeInTheDocument();
    });

    await step("Verify typing shows clear button and emits event", async () => {
      const searchInput = canvasElement.querySelector("ledger-search-input");
      const input = searchInput?.shadowRoot?.querySelector("input");

      let lastValue = "";
      searchInput?.addEventListener("search-input-change", ((
        e: CustomEvent,
      ) => {
        lastValue = e.detail.value;
      }) as EventListener);

      if (input) {
        await userEvent.type(input, "test");
        await waitFor(() => {
          expect(lastValue).toBe("test");
        });

        const clearButton = searchInput?.shadowRoot?.querySelector("button");
        expect(clearButton).toBeInTheDocument();
      }
    });

    await step("Verify clear button clears input", async () => {
      const searchInput = canvasElement.querySelector("ledger-search-input");
      const clearButton = searchInput?.shadowRoot?.querySelector("button");

      let clearFired = false;
      searchInput?.addEventListener("search-input-clear", () => {
        clearFired = true;
      });

      if (clearButton) {
        await userEvent.click(clearButton as HTMLElement);
        await waitFor(() => {
          expect(clearFired).toBe(true);
        });

        const input = searchInput?.shadowRoot?.querySelector("input");
        expect(input?.value).toBe("");
      }
    });

    await step("Verify accessibility attributes", async () => {
      const searchInput = canvasElement.querySelector("ledger-search-input");
      const input = searchInput?.shadowRoot?.querySelector("input");
      expect(input).toHaveAttribute("aria-label", "Search account");
    });
  },
};
