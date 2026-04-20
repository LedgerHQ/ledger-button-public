import "../button/ledger-button";
import "./ledger-modal";
import "../../molecule/toolbar/ledger-toolbar";
import "../../organism/status/ledger-status";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { animate } from "motion";

import type { FloatingButtonPosition } from "../floating-button/ledger-floating-button";
import type { LedgerModal } from "./ledger-modal";
import { MorphAnimation } from "./morph-animation";

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

function positionToCSS(position: FloatingButtonPosition): string {
  switch (position) {
    case "bottom-right":
      return `bottom: ${FLOATING_BUTTON_OFFSET}px; right: ${FLOATING_BUTTON_OFFSET}px;`;
    case "bottom-left":
      return `bottom: ${FLOATING_BUTTON_OFFSET}px; left: ${FLOATING_BUTTON_OFFSET}px;`;
    case "bottom-center":
      return `bottom: ${FLOATING_BUTTON_OFFSET}px; left: 50%; transform: translateX(-50%);`;
    case "top-right":
      return `top: ${FLOATING_BUTTON_OFFSET}px; right: ${FLOATING_BUTTON_OFFSET}px;`;
    case "top-left":
      return `top: ${FLOATING_BUTTON_OFFSET}px; left: ${FLOATING_BUTTON_OFFSET}px;`;
    case "top-center":
      return `top: ${FLOATING_BUTTON_OFFSET}px; left: 50%; transform: translateX(-50%);`;
    case "middle-right":
      return `top: 50%; right: ${FLOATING_BUTTON_OFFSET}px; transform: translateY(-50%);`;
    default:
      return `bottom: ${FLOATING_BUTTON_OFFSET}px; right: ${FLOATING_BUTTON_OFFSET}px;`;
  }
}

function moveFloatingTarget(position: FloatingButtonPosition) {
  const target = document.getElementById("floating-target");
  if (!target) return;
  target.style.cssText = `
    position: fixed;
    ${positionToCSS(position)}
    width: ${FLOATING_BUTTON_SIZE}px;
    height: ${FLOATING_BUTTON_SIZE}px;
    border-radius: 9999px;
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    z-index: 9999;
    border: 1px solid rgba(255,255,255,0.15);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
}

function renderFloatingButtonTarget() {
  return html`
    <div
      id="floating-target"
      style="
        position: fixed;
        bottom: ${FLOATING_BUTTON_OFFSET}px;
        right: ${FLOATING_BUTTON_OFFSET}px;
        width: ${FLOATING_BUTTON_SIZE}px;
        height: ${FLOATING_BUTTON_SIZE}px;
        border-radius: 9999px;
        background: black;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        z-index: 9999;
        border: 1px solid rgba(255,255,255,0.15);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      "
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="3"
          fill="none"
          stroke="white"
          stroke-width="1.5"
        />
        <rect x="7" y="15" width="4" height="4" rx="1" fill="white" />
      </svg>
    </div>
  `;
}

function fadeInFloatingTarget() {
  const target = document.getElementById("floating-target");
  if (target) {
    animate(target, { opacity: [0, 1] }, { duration: 0.39, ease: "easeOut" });
  }
}

function resetFloatingTarget() {
  const target = document.getElementById("floating-target");
  if (target) {
    target.style.opacity = "0";
  }
}

let currentPosition: FloatingButtonPosition = "bottom-right";

const meta: Meta = {
  title: "Animation/Morph Close",
  argTypes: {
    position: {
      control: { type: "select" },
      options: ALL_POSITIONS,
      description: "Target position for the floating button",
      table: {
        type: { summary: "FloatingButtonPosition" },
        defaultValue: { summary: "bottom-right" },
      },
    },
  },
  args: {
    position: "bottom-right",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Morph close animation that shrinks and moves the modal along a curved path to the floating button position. Used on the connection-success screen after first-time login. View each story individually (not in Docs) to interact with the full-screen modal.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const MorphToPosition: Story = {
  render: (args) => {
    currentPosition = (args.position as FloatingButtonPosition) ?? "bottom-right";

    return html`
      <ledger-button
        @click=${() => {
          resetFloatingTarget();
          moveFloatingTarget(currentPosition);
          const modal = document.querySelector(
            "ledger-modal",
          ) as LedgerModal | null;
          if (modal) {
            modal.openModal();
          }
        }}
        label="Open Modal"
        variant="secondary"
      ></ledger-button>

      <ledger-modal>
        <div slot="toolbar">
          <ledger-toolbar
            title=""
            .canClose=${true}
            @ledger-toolbar-close=${() => {
              const modal = document.querySelector(
                "ledger-modal",
              ) as LedgerModal | null;
              if (modal) {
                modal.closeModalWithMorph(
                  computeTargetRect(currentPosition),
                  currentPosition,
                );
                setTimeout(fadeInFloatingTarget, 800);
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
                "ledger-modal",
              ) as LedgerModal | null;
              if (modal) {
                modal.closeModalWithMorph(
                  computeTargetRect(currentPosition),
                  currentPosition,
                );
                setTimeout(fadeInFloatingTarget, 800);
              }
            }}
          ></ledger-status>
        </div>
      </ledger-modal>

      ${renderFloatingButtonTarget()}
    `;
  },
};

export const MorphComparison: Story = {
  render: (args) => {
    currentPosition = (args.position as FloatingButtonPosition) ?? "bottom-right";

    return html`
      <div style="display: flex; gap: 16px;">
        <ledger-button
          @click=${() => {
            resetFloatingTarget();
            moveFloatingTarget(currentPosition);
            const modal = document.querySelector(
              "#morph-modal",
            ) as LedgerModal | null;
            if (modal) {
              modal.openModal();
            }
          }}
          label="Open (Morph Close)"
          variant="secondary"
        ></ledger-button>

        <ledger-button
          @click=${() => {
            const modal = document.querySelector(
              "#normal-modal",
            ) as LedgerModal | null;
            if (modal) {
              modal.openModal();
            }
          }}
          label="Open (Normal Close)"
          variant="secondary"
        ></ledger-button>
      </div>

      <ledger-modal id="morph-modal">
        <div slot="toolbar">
          <ledger-toolbar
            title="Morph Close"
            .canClose=${true}
            @ledger-toolbar-close=${() => {
              const modal = document.querySelector(
                "#morph-modal",
              ) as LedgerModal | null;
              if (modal) {
                modal.closeModalWithMorph(
                  computeTargetRect(currentPosition),
                  currentPosition,
                );
                setTimeout(fadeInFloatingTarget, 800);
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
                "#morph-modal",
              ) as LedgerModal | null;
              if (modal) {
                modal.closeModalWithMorph(
                  computeTargetRect(currentPosition),
                  currentPosition,
                );
                setTimeout(fadeInFloatingTarget, 800);
              }
            }}
          ></ledger-status>
        </div>
      </ledger-modal>

      <ledger-modal id="normal-modal">
        <div slot="toolbar">
          <ledger-toolbar
            title="Normal Close"
            .canClose=${true}
            @ledger-toolbar-close=${() => {
              const modal = document.querySelector(
                "#normal-modal",
              ) as LedgerModal | null;
              if (modal) {
                modal.closeModal();
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
                "#normal-modal",
              ) as LedgerModal | null;
              if (modal) {
                modal.closeModal();
              }
            }}
          ></ledger-status>
        </div>
      </ledger-modal>

      ${renderFloatingButtonTarget()}
    `;
  },
};

export const IsolatedMorphAnimation: Story = {
  render: (args) => {
    const morphAnimation = new MorphAnimation();
    currentPosition = (args.position as FloatingButtonPosition) ?? "bottom-right";

    return html`
      <p style="color: white; margin-bottom: 16px;">
        Click the box below to trigger the morph animation directly (no modal
        wrapper). It auto-resets after 1.5s. Use the
        <strong>position</strong> control to change the target.
      </p>

      <div style="display: flex; justify-content: center; padding: 80px 0;">
        <div
          id="morph-box"
          style="
            width: 400px;
            max-width: calc(100% - 32px);
            background: #1a1a1a;
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
          "
          @click=${async () => {
            const box = document.getElementById("morph-box");
            if (!box) return;
            resetFloatingTarget();
            moveFloatingTarget(currentPosition);

            await morphAnimation.morphClose(
              box,
              computeTargetRect(currentPosition),
              currentPosition,
            );
            fadeInFloatingTarget();

            setTimeout(() => {
              resetFloatingTarget();
              box.style.transform = "";
              box.style.opacity = "1";
              box.style.borderRadius = "16px";
              for (const child of Array.from(box.children) as HTMLElement[]) {
                child.style.opacity = "1";
              }
            }, 1500);
          }}
        >
          <div style="padding: 16px; border-bottom: 1px solid #333;">
            <span style="color: #888; font-size: 14px;">Toolbar area</span>
          </div>
          <div
            style="padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 24px;"
          >
            <div
              style="
                width: 64px; height: 64px; border-radius: 50%;
                background: #1a5c2a; display: flex; align-items: center;
                justify-content: center;
              "
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <span style="color: white; font-size: 16px;"
              >You are now connected</span
            >
            <div
              style="
                width: 100%; padding: 12px; background: #444; border-radius: 9999px;
                text-align: center; color: white; font-size: 14px;
              "
            >
              Close
            </div>
          </div>
        </div>
      </div>

      ${renderFloatingButtonTarget()}
    `;
  },
};

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
                resetFloatingTarget();
                moveFloatingTarget(position);
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
                setTimeout(fadeInFloatingTarget, 800);
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
                setTimeout(fadeInFloatingTarget, 800);
              }
            }}
          ></ledger-status>
        </div>
      </ledger-modal>

      ${renderFloatingButtonTarget()}
    `;
  },
};
