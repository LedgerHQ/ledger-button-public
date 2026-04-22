import "../button/ledger-button";
import "./ledger-modal";
import "../../molecule/toolbar/ledger-toolbar";
import "../../organism/status/ledger-status";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import type { FloatingButtonPosition } from "../floating-button/ledger-floating-button";
import type { LedgerModal } from "./ledger-modal";

const FLOATING_BUTTON_SIZE = 64;
const FLOATING_BUTTON_OFFSET = 24;

const ALL_POSITIONS: FloatingButtonPosition[] = [
  "bottom-right",
  "bottom-left",
  "bottom-center",
  "top-right",
  "top-left",
  "top-center",
  "middle-right",
];

function computeTargetRect(position: FloatingButtonPosition): DOMRect {
  const size = FLOATING_BUTTON_SIZE;
  const offset = FLOATING_BUTTON_OFFSET;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x: number;
  let y: number;

  switch (position) {
    case "bottom-left":
      x = offset;
      y = vh - offset - size;
      break;
    case "bottom-center":
      x = (vw - size) / 2;
      y = vh - offset - size;
      break;
    case "top-right":
      x = vw - offset - size;
      y = offset;
      break;
    case "top-left":
      x = offset;
      y = offset;
      break;
    case "top-center":
      x = (vw - size) / 2;
      y = offset;
      break;
    case "middle-right":
      x = vw - offset - size;
      y = (vh - size) / 2;
      break;
    case "bottom-right":
    default:
      x = vw - offset - size;
      y = vh - offset - size;
      break;
  }

  return new DOMRect(x, y, size, size);
}

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

      <ledger-modal id="grid-modal">
        <div slot="toolbar">
          <ledger-toolbar
            title=""
            .canClose=${true}
            @ledger-toolbar-close=${() => {
              const modal = document.querySelector(
                "#grid-modal",
              ) as LedgerModal | null;
              if (modal) {
                modal.closeModalWithMorph(
                  computeTargetRect(currentPosition),
                  currentPosition,
                );
              }
            }}
          ></ledger-toolbar>
        </div>
        <div style="padding: 24px; padding-top: 0;">
          <ledger-status
            type="success"
            title="You are now connected"
            primary-button-label="Close"
            secondary-button-label=""
            @status-action=${() => {
              const modal = document.querySelector(
                "#grid-modal",
              ) as LedgerModal | null;
              if (modal) {
                modal.closeModalWithMorph(
                  computeTargetRect(currentPosition),
                  currentPosition,
                );
              }
            }}
          ></ledger-status>
        </div>
      </ledger-modal>
    `;
  },
};
