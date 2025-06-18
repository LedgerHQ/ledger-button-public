import "./ledger-modal-atom";
import "../button/ledger-button-atom";

import { expect, waitFor } from "@storybook/test";
import { userEvent } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { within as shadowWithin } from "shadow-dom-testing-library";

import type {
  LedgerModalAtom,
  LedgerModalAtomAttributes,
} from "./ledger-modal-atom";

const meta: Meta<LedgerModalAtomAttributes> = {
  title: "Component/Atom/Modal",
  tags: ["autodocs"],
  render: (args) =>
    html`<div>
      <ledger-button-atom
        id="trigger-button"
        label="Connect Ledger"
        variant="primary"
        size="medium"
        icon
        @ledger-button-click=${(e: Event) => {
          const container = (e.target as HTMLElement).closest("div");
          const modal = container?.querySelector(
            "ledger-modal-atom"
          ) as LedgerModalAtom;
          modal?.openModal();
        }}
      ></ledger-button-atom>
      <ledger-modal-atom
        data-testid="modal"
        .isOpen=${args.isOpen}
        .title=${args.title}
        @modal-opened=${(e: CustomEvent) => {
          console.log("Modal opened:", e.detail);
        }}
        @modal-closed=${(e: CustomEvent) => {
          console.log("Modal closed:", e.detail);
        }}
      >
        <p>This is the modal content. You can add any content here.</p>
      </ledger-modal-atom>
    </div>`,
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the modal is open",
    },
    title: {
      control: "text",
      description: "The title displayed in the modal header",
    },
  },
};

export default meta;
type Story = StoryObj<LedgerModalAtomAttributes>;

export const Default: Story = {
  args: {
    isOpen: false,
    title: "Connect a Ledger",
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
    title: "Connect a Ledger",
  },
};

export const TestModalInteractions: Story = {
  args: {
    isOpen: false,
    title: "Test Modal",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = shadowWithin(canvasElement);
    const modal = canvas.getByTestId<LedgerModalAtom>("modal");

    await step("Initial state - modal should be closed", async () => {
      expect(modal.isOpen).toBe(false);
      expect(modal.shadowRoot?.querySelector(".modal-overlay")).toBeNull();
    });

    await step("Open modal programmatically", async () => {
      modal.openModal();

      await waitFor(() => {
        expect(modal.isOpen).toBe(true);
        expect(
          modal.shadowRoot?.querySelector(".modal-overlay")
        ).not.toBeNull();
      });
    });

    await step("Close modal using close button", async () => {
      const closeButton = canvas.getByShadowTestId("close-button");
      await userEvent.click(closeButton);

      expect(modal.isOpen).toBe(false);
    });

    await step("Close modal using Escape key", async () => {
      modal.openModal();
      expect(modal.isOpen).toBe(true);
      await userEvent.keyboard("{Escape}");

      expect(modal.isOpen).toBe(false);
    });

    await step("Open modal and test overlay click", async () => {
      modal.openModal();

      await waitFor(async () => {
        expect(modal.isOpen).toBe(true);

        const overlay = canvas.getByShadowTestId("modal-overlay");
        await userEvent.click(overlay);

        expect(modal.isOpen).toBe(false);
      });
    });
  },
};
