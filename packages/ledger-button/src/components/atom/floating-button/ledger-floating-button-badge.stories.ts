import "../icon/ledger-icon";
import "./ledger-floating-button-badge";

import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { css, html, LitElement } from "lit";
import { query, state } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";
import { FloatingButtonBadgeAnimation } from "./floating-button-badge-animation";
import type { LedgerFloatingButtonBadge } from "./ledger-floating-button-badge";
import type { FloatingButtonBadgeVariant } from "./ledger-floating-button-badge";

const ANIMATION_DEMO_TAG = "ledger-floating-button-badge-animation-demo";

const FLOATING_BUTTON_MASK_STYLE =
  "-webkit-mask-image: radial-gradient(circle closest-side at 87.5% 12.5%, transparent 185%, white 195%); mask-image: radial-gradient(circle closest-side at 87.5% 12.5%, transparent 185%, white 195%);";

const FLOATING_BUTTON_CIRCULAR_CLASSES =
  "text-on-interactive flex cursor-pointer items-center justify-center bg-black shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-[transform,box-shadow] duration-200 ease-in-out hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)] border-muted-subtle h-64 w-64 shrink-0 rounded-full border";

function floatingButtonWithBadge(args: {
  variant: FloatingButtonBadgeVariant;
  count: number;
}) {
  return html`
    <div class="relative inline-block">
      <button
        type="button"
        class=${FLOATING_BUTTON_CIRCULAR_CLASSES}
        style=${FLOATING_BUTTON_MASK_STYLE}
        aria-hidden="true"
        tabindex="-1"
      >
        <ledger-icon
          type="ledger"
          .size=${32}
          fillColor="white"
        ></ledger-icon>
      </button>
      <ledger-floating-button-badge
        .variant=${args.variant}
        .count=${args.count}
      ></ledger-floating-button-badge>
    </div>
  `;
}

const meta: Meta<{
  variant: FloatingButtonBadgeVariant;
  count: number;
}> = {
  title: "Component/Atom/FloatingButtonBadge",
  tags: ["autodocs"],
  render: (args) => html`
    <div
      class="flex min-h-[240px] items-center justify-center bg-neutral-950 p-32"
      style="font-family: system-ui, sans-serif;"
    >
      ${floatingButtonWithBadge({
        variant: args.variant,
        count: args.count,
      })}
    </div>
  `,
  argTypes: {
    variant: {
      control: "select",
      options: ["pending", "validated"],
      description:
        "Badge variant: pending shows count, validated shows the check icon",
    },
    count: {
      control: "number",
      description: "Count shown when variant is pending",
    },
  },
};

export default meta;
type Story = StoryObj<{
  variant: FloatingButtonBadgeVariant;
  count: number;
}>;

export const Playground: Story = {
  args: {
    variant: "pending",
    count: 3,
  },
};

export const Pending: Story = {
  args: {
    variant: "pending",
    count: 12,
  },
};

export const Validated: Story = {
  args: {
    variant: "validated",
    count: 0,
  },
};

const demoStyles = css`
  :host {
    display: block;
    font-family: system-ui, sans-serif;
  }
  .controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .controls button {
    cursor: pointer;
    border-radius: 9999px;
    border: 1px solid rgb(82 82 82);
    background: rgb(38 38 38);
    color: rgb(245 245 245);
    padding: 8px 16px;
    font-size: 14px;
  }
  .controls button:hover {
    background: rgb(64 64 64);
  }
  .controls button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

@tailwindElement(demoStyles)
class LedgerFloatingButtonBadgeAnimationDemo extends LitElement {

  private readonly badgeAnimation = new FloatingButtonBadgeAnimation();

  @state()
  private currentVariant: FloatingButtonBadgeVariant = "pending";

  @state()
  private isAnimating = false;

  @state()
  private showBadge = true;

  @query("ledger-floating-button-badge")
  private readonly badgeEl!: LedgerFloatingButtonBadge;

  private async runTransition(
    targetVariant: FloatingButtonBadgeVariant,
  ): Promise<void> {
    if (this.isAnimating || this.currentVariant === targetVariant) return;
    this.isAnimating = true;

    if (this.badgeEl) {
      await this.badgeAnimation.shrinkOut(this.badgeEl);
    }

    this.currentVariant = targetVariant;
    await this.updateComplete;

    if (this.badgeEl) {
      await this.badgeAnimation.growIn(this.badgeEl);
    }

    this.isAnimating = false;
  }

  private async runFirstAppearance(): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.showBadge = false;
    await this.updateComplete;

    this.currentVariant = "pending";
    this.showBadge = true;
    await this.updateComplete;

    if (this.badgeEl) {
      this.badgeEl.style.transform = "scale(0)";
      await this.badgeAnimation.growIn(this.badgeEl);
    }

    this.isAnimating = false;
  }

  private async runFullCycle(): Promise<void> {
    if (this.isAnimating) return;

    this.currentVariant = "pending";
    await this.updateComplete;

    await this.runTransition("validated");
    await new Promise((r) => setTimeout(r, 1500));
    await this.runTransition("pending");
  }

  override render() {
    const maskStyle = this.showBadge ? FLOATING_BUTTON_MASK_STYLE : "";

    return html`
      <div
        class="flex min-h-[280px] flex-col items-center justify-center gap-24 bg-neutral-950 p-32"
      >
        <p class="m-0 max-w-sm text-center text-neutral-400 text-sm">
          Animates the badge between pending and validated using the real Motion
          spring transitions. Click "First appearance" to see the badge grow in
          from scratch. Click "Full cycle" to see the complete sequence.
        </p>
        <div class="controls">
          <button
            type="button"
            ?disabled=${this.isAnimating}
            @click=${() => this.runFirstAppearance()}
          >
            First appearance
          </button>
          <button
            type="button"
            ?disabled=${this.isAnimating}
            @click=${() => this.runTransition("validated")}
          >
            To validated
          </button>
          <button
            type="button"
            ?disabled=${this.isAnimating}
            @click=${() => this.runTransition("pending")}
          >
            To pending
          </button>
          <button
            type="button"
            ?disabled=${this.isAnimating}
            @click=${() => this.runFullCycle()}
          >
            Full cycle
          </button>
        </div>
        <div class="relative inline-block">
          <button
            type="button"
            class=${FLOATING_BUTTON_CIRCULAR_CLASSES}
            style=${maskStyle}
            aria-hidden="true"
            tabindex="-1"
          >
            <ledger-icon
              type="ledger"
              .size=${32}
              fillColor="white"
            ></ledger-icon>
          </button>
          ${this.showBadge
            ? html`<ledger-floating-button-badge
                .variant=${this.currentVariant}
                .count=${3}
              ></ledger-floating-button-badge>`
            : null}
        </div>
      </div>
    `;
  }
}

if (!customElements.get(ANIMATION_DEMO_TAG)) {
  customElements.define(
    ANIMATION_DEMO_TAG,
    LedgerFloatingButtonBadgeAnimationDemo,
  );
}

export const AnimationTransitions: Story = {
  render: () =>
    html`<ledger-floating-button-badge-animation-demo></ledger-floating-button-badge-animation-demo>`,
};
