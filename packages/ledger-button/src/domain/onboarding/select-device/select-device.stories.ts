import "./select-device";
import "../../../context/core-context";
import "../../../context/language-context";
import "../../../components/index";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

import en from "../../../i18n/en.json" with { type: "json" };
import type { SelectDeviceScreen } from "./select-device";

const deviceNotOnboardedCopy = en.error.device.DeviceNotOnboarded;

const meta: Meta = {
  title: "Screens/Onboarding/SelectDeviceScreen",
  render: () => html`
    <core-provider>
      <language-provider>
        <select-device-screen></select-device-screen>
      </language-provider>
    </core-provider>
  `,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const InContext: Story = {
  render: () => html`
    <core-provider>
      <language-provider>
        <ledger-modal-story-wrapper title="Connect a Ledger device">
          <select-device-screen></select-device-screen>
        </ledger-modal-story-wrapper>
      </language-provider>
    </core-provider>
  `,
};

export const DeviceNotOnboarded: Story = {
  render: () => html`
    <core-provider>
      <language-provider>
        <ledger-modal-story-wrapper title="Connect a Ledger device">
          <select-device-screen></select-device-screen>
        </ledger-modal-story-wrapper>
      </language-provider>
    </core-provider>
  `,
  play: async ({ canvasElement }) => {
    await customElements.whenDefined("select-device-screen");

    const screen = canvasElement.querySelector(
      "select-device-screen",
    ) as SelectDeviceScreen | null;

    if (!screen) {
      return;
    }

    await screen.updateComplete;

    screen.controller.errorData = {
      title: deviceNotOnboardedCopy.title,
      message: deviceNotOnboardedCopy.description.replace(
        "{device}",
        en.common.device.model.nanoX,
      ),
      statusType: "info",
      cta1: {
        label: deviceNotOnboardedCopy.cta1,
        action: () => undefined,
      },
      cta2: {
        label: deviceNotOnboardedCopy.cta2,
        action: () => undefined,
      },
    };
    screen.requestUpdate();
  },
};
