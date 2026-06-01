import type { FloatingButtonPosition } from "./ledger-floating-button.js";

/**
 * Pixel size of the circular floating button. Must stay in sync with the
 * Tailwind classes `h-64 w-64` on `floatingButtonVariants.variant.circular`
 * in `ledger-floating-button.ts`.
 */
export const FLOATING_BUTTON_SIZE = 64;

/**
 * Distance from the closest viewport edge in px. Must stay in sync with the
 * Tailwind offset classes (`right-24`, `bottom-24`, …) on
 * `positionVariants.position` in `ledger-floating-button.ts`.
 */
export const FLOATING_BUTTON_OFFSET = 24;

/**
 * Pure, viewport-only computation of where the floating button will land
 * for a given position. Mirrors the placement applied by
 * `positionVariants` in `ledger-floating-button.ts`.
 *
 * Used as a fallback when the live element can't be found (e.g. during a
 * morph-close that begins before the FB is mounted) and by Storybook
 * stories that don't render the real button.
 */
export function computeFloatingButtonRect(
  position: FloatingButtonPosition,
): DOMRect {
  const size = FLOATING_BUTTON_SIZE;
  const offset = FLOATING_BUTTON_OFFSET;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (position) {
    case "bottom-left":
      return new DOMRect(offset, vh - offset - size, size, size);
    case "bottom-center":
      return new DOMRect((vw - size) / 2, vh - offset - size, size, size);
    case "top-right":
      return new DOMRect(vw - offset - size, offset, size, size);
    case "top-left":
      return new DOMRect(offset, offset, size, size);
    case "top-center":
      return new DOMRect((vw - size) / 2, offset, size, size);
    case "middle-right":
      return new DOMRect(vw - offset - size, (vh - size) / 2, size, size);
    case "bottom-right":
    default:
      return new DOMRect(vw - offset - size, vh - offset - size, size, size);
  }
}
