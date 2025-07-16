import "./ledger-modal";
import "../button/ledger-button";
import "../../molecule/info-state/ledger-info-state";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { within as shadowWithin } from "shadow-dom-testing-library";
import { expect, userEvent, waitFor } from "storybook/test";

import type { LedgerModal } from "./ledger-modal";

const meta: Meta = {
  title: "Component/Atom/Modal",
  tags: ["autodocs"],
  render: (args) =>
    html`<div>
      <ledger-button
        id="trigger-button"
        label="Connect Ledger"
        variant="primary"
        size="medium"
        icon
        @ledger-button-click=${(e: Event) => {
          const container = (e.target as HTMLElement).closest("div");
          const modal = container?.querySelector("ledger-modal") as LedgerModal;
          modal?.openModal();
        }}
      ></ledger-button>
      <ledger-modal
        data-testid="modal"
        .isOpen=${!!args.isOpen}
        .title=${args.title}
        @modal-opened=${(e: CustomEvent) => {
          console.log("Modal opened:", e.detail);
        }}
        @modal-closed=${(e: CustomEvent) => {
          console.log("Modal closed:", e.detail);
        }}
      >
        <ledger-info-state
          device="flex"
          title="Continue on your Ledger Flex"
          subtitle="Follow instructions appearing on your Ledger's Trusted Display"
        ></ledger-info-state>
      </ledger-modal>
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
type Story = StoryObj;

export const Default: Story = {
  args: {
    isOpen: false,
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
    const modal = canvas.getByTestId<LedgerModal>("modal");

    await step("Initial state - modal should be closed", async () => {
      expect(modal.isOpen).toBe(false);
      expect(modal.getAttribute("isOpen")).toBe(null);
    });

    await step("Open modal programmatically", async () => {
      modal.openModal();

      await waitFor(() => {
        expect(modal.isOpen).toBe(true);
        expect(
          modal.shadowRoot?.querySelector(".modal-overlay"),
        ).not.toBeNull();
      });
    });

    await step("Close modal using close button", async () => {
      const toolbar = modal.shadowRoot?.querySelector("ledger-toolbar");
      const closeIcon = toolbar?.shadowRoot?.querySelector(
        "ledger-icon[type='close']",
      );

      if (closeIcon) {
        await userEvent.click(closeIcon as HTMLElement);
      }

      await waitFor(() => {
        expect(modal.isOpen).toBe(false);
      });
    });

    await step("Close modal using Escape key", async () => {
      modal.openModal();
      expect(modal.isOpen).toBe(true);
      await userEvent.keyboard("{Escape}");

      await waitFor(() => {
        expect(modal.isOpen).toBe(false);
      });
    });

    await step("Open modal and test overlay click", async () => {
      modal.openModal();

      await waitFor(async () => {
        expect(modal.isOpen).toBe(true);

        const overlay = canvas.getByShadowTestId("modal-overlay");
        await userEvent.click(overlay);

        await waitFor(() => {
          expect(modal.isOpen).toBe(false);
        });
      });
    });
  },
};
