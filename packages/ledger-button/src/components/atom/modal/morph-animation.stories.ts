import "../button/ledger-button";
import "./ledger-modal";
import "../../molecule/toolbar/ledger-toolbar";
import "../icon/ledger-icon";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import { computeFloatingButtonRect } from "../floating-button/floating-button-rect";
import type { FloatingButtonPosition } from "../floating-button/ledger-floating-button";
import type { LedgerModal } from "./ledger-modal";

const ALL_POSITIONS: FloatingButtonPosition[] = [
  "bottom-right",
  "bottom-left",
  "bottom-center",
  "top-right",
  "top-left",
  "top-center",
  "middle-right",
];

let currentPosition: FloatingButtonPosition = "bottom-right";

const meta: Meta = {
  title: "Animation/Morph Close",
  parameters: {
    docs: {
      description: {
        component:
          "Morph close animation that shrinks and moves the modal along a curved path to the floating button position. Used on the connection-success screen after first-time login. View the story individually (not in Docs) to interact with the full-screen modal.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AllPositionsGrid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Buttons for all supported floating-button positions. Click one to open a modal then close it with the morph trajectory aimed at that position. Useful for QA-ing the Bezier trajectory for corners and the straight-line behaviour for mid-edges.",
      },
    },
  },
  render: () => {
    return html`
      <div
        style="display: grid; grid-template-columns: repeat(4, auto); gap: 8px; margin-bottom: 24px;"
      >
        ${ALL_POSITIONS.map(
          (position) => html`
            <ledger-button
              @click=${() => {
                currentPosition = position;
                const modal = document.querySelector(
                  "#grid-modal",
                ) as LedgerModal | null;
                if (modal) {
                  modal.openModal();
                }
              }}
              label=${position}
              variant="secondary"
            ></ledger-button>
          `,
        )}
      </div>

      <ledger-modal id="grid-modal" gradient="success">
        <div slot="toolbar">
          <ledger-toolbar
            title=""
            .canClose=${true}
            @ledger-toolbar-close=${closeWithMorph}
          ></ledger-toolbar>
        </div>
        <div
          class="flex h-full flex-col items-center justify-center gap-24 p-24"
          @click=${closeWithMorph}
        >
          <div
            class="bg-muted-transparent text-success flex h-72 w-72 items-center justify-center rounded-full"
          >
            <ledger-icon
              type="checkMarkCircleFill"
              size="40"
              fillColor="currentColor"
            ></ledger-icon>
          </div>
          <h2 class="text-base heading-3-semi-bold text-center">
            You are now connected
          </h2>
        </div>
      </ledger-modal>
    `;
  },
};

function closeWithMorph(): void {
  const modal = document.querySelector("#grid-modal") as LedgerModal | null;
  if (!modal) return;
  modal.closeModal({
    morph: {
      targetRect: computeFloatingButtonRect(currentPosition),
      position: currentPosition,
    },
  });
}
