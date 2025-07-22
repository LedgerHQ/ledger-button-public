import "./select-device";
import "../../../context/core-context.js";
import "../../../context/language-context.js";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";

const meta: Meta = {
  title: "Screens/Onboarding/SelectDeviceScreen",
  tags: ["autodocs"],
  render: () => html`
    <core-provider>
      <language-provider>
        <div class="rounded-xl bg-black p-16" style="width: 400px">
          <select-device-screen></select-device-screen>
        </div>
      </language-provider>
    </core-provider>
  `,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
