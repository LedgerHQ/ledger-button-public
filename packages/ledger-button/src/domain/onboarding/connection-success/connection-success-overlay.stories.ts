import "./connection-success-overlay.js";
import "../../../context/language-context.js";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import { computeFloatingButtonRect } from "../../../components/atom/floating-button/floating-button-rect.js";

const meta: Meta = {
  title: "Screens/Onboarding/ConnectionSuccessOverlay",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj;

export const ReplayableMorph: Story = {
  render: () => {
    const targetRect = computeFloatingButtonRect("bottom-right");

    const replay = () => {
      const overlay = document.querySelector(
        "#connection-success-overlay-story",
      ) as HTMLElement | null;

      if (!overlay) {
        return;
      }

      const nextRunId =
        Number(overlay.getAttribute("data-run-id") ?? "0") + 1;
      overlay.setAttribute("data-run-id", String(nextRunId));
      (overlay as HTMLElement & { runId: number }).runId = nextRunId;
    };

    return html`
      <language-provider>
        <div style="min-height: 100vh;">
          <button
            style="position: fixed; top: 24px; left: 24px; z-index: 8000;"
            @click=${replay}
          >
            Replay overlay
          </button>

          <div
            style="
              position: fixed;
              left: ${targetRect.left}px;
              top: ${targetRect.top}px;
              width: ${targetRect.width}px;
              height: ${targetRect.height}px;
              border-radius: 9999px;
              background: black;
              z-index: 7732;
            "
          ></div>

          <connection-success-overlay
            id="connection-success-overlay-story"
            .targetRect=${targetRect}
            data-run-id="0"
          ></connection-success-overlay>
        </div>
      </language-provider>
    `;
  },
};
