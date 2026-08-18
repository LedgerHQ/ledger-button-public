import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadgeAnimationController } from "./floating-button-badge-animation-controller";

type BadgeState = {
  celebration: boolean;
  hasPending: boolean;
  postCloseTooltip: boolean;
  modalIsOpen: boolean;
};

const IDLE: BadgeState = {
  celebration: false,
  hasPending: false,
  postCloseTooltip: false,
  modalIsOpen: false,
};

function createHost(): ReactiveControllerHost & {
  updateComplete: Promise<boolean>;
} {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

function syncAndFlush(ctrl: BadgeAnimationController, state: BadgeState) {
  ctrl.sync(
    state.celebration,
    state.hasPending,
    state.postCloseTooltip,
    state.modalIsOpen,
  );
  ctrl.flush();
}

async function drainMicrotasks(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

describe("BadgeAnimationController", () => {
  let host: ReturnType<typeof createHost>;
  let ctrl: BadgeAnimationController;

  beforeEach(() => {
    host = createHost();
    ctrl = new BadgeAnimationController(host, () => null);
  });

  describe("badge appearance", () => {
    it("should trigger appear animation when pending arrives with modal closed", () => {
      syncAndFlush(ctrl, { ...IDLE, hasPending: true });

      expect(ctrl.isAnimating).toBe(true);
      expect(ctrl.badgeAppearing).toBe(true);
      expect(ctrl.animatedVariant).toBe("pending");
    });

    it("should defer badge when pending arrives while modal is open", () => {
      syncAndFlush(ctrl, { ...IDLE, hasPending: true, modalIsOpen: true });

      expect(ctrl.deferredBadgeAppearance).toBe(true);
      expect(ctrl.isAnimating).toBe(false);
      expect(ctrl.badgeAppearing).toBe(false);
    });

    it("should trigger appear animation when post-close tooltip fires after deferred badge", () => {
      syncAndFlush(ctrl, { ...IDLE, hasPending: true, modalIsOpen: true });
      expect(ctrl.deferredBadgeAppearance).toBe(true);

      syncAndFlush(ctrl, { ...IDLE, hasPending: true, postCloseTooltip: true });

      expect(ctrl.isAnimating).toBe(true);
      expect(ctrl.badgeAppearing).toBe(true);
      expect(ctrl.deferredBadgeAppearance).toBe(false);
    });

    it("should not trigger animation when post-close tooltip fires without deferred badge", async () => {
      syncAndFlush(ctrl, { ...IDLE, hasPending: true });
      await drainMicrotasks();

      syncAndFlush(ctrl, { ...IDLE, hasPending: true, postCloseTooltip: true });

      expect(ctrl.badgeAppearing).toBe(false);
    });
  });

  describe("celebration transitions", () => {
    it("should transition to validated when celebration starts", () => {
      syncAndFlush(ctrl, { ...IDLE, hasPending: true });

      syncAndFlush(ctrl, { ...IDLE, celebration: true, hasPending: true });

      expect(ctrl.isAnimating).toBe(true);
      expect(ctrl.delayTooltipOpen).toBe(true);
      expect(ctrl.animatedVariant).toBe("pending");
    });

    it("should transition back to pending when celebration ends with remaining pending", () => {
      syncAndFlush(ctrl, { ...IDLE, celebration: true, hasPending: true });

      syncAndFlush(ctrl, { ...IDLE, hasPending: true });

      expect(ctrl.isAnimating).toBe(true);
      expect(ctrl.animatedVariant).toBe("validated");
    });

    it("should trigger exit animation when celebration ends with no remaining pending", () => {
      syncAndFlush(ctrl, { ...IDLE, celebration: true });

      syncAndFlush(ctrl, IDLE);

      expect(ctrl.isAnimating).toBe(true);
      expect(ctrl.animatedVariant).toBe("validated");
    });
  });

  describe("idle state", () => {
    it("should not trigger any animation when nothing changes", () => {
      syncAndFlush(ctrl, IDLE);

      expect(ctrl.isAnimating).toBe(false);
      expect(ctrl.animatedVariant).toBeNull();
      expect(ctrl.badgeAppearing).toBe(false);
      expect(ctrl.delayTooltipOpen).toBe(false);
    });

    it("should not trigger animation when pending stays stable across syncs", async () => {
      syncAndFlush(ctrl, { ...IDLE, hasPending: true });
      await drainMicrotasks();

      syncAndFlush(ctrl, { ...IDLE, hasPending: true });

      expect(ctrl.badgeAppearing).toBe(false);
    });
  });

  describe("sync/flush separation", () => {
    it("should set deferred flag during sync before flush runs", () => {
      ctrl.sync(false, true, false, true);

      expect(ctrl.deferredBadgeAppearance).toBe(true);
      expect(ctrl.isAnimating).toBe(false);

      ctrl.flush();

      expect(ctrl.isAnimating).toBe(false);
    });

    it("should not start animation from sync alone", () => {
      ctrl.sync(false, true, false, false);

      expect(ctrl.isAnimating).toBe(false);
      expect(ctrl.badgeAppearing).toBe(false);

      ctrl.flush();

      expect(ctrl.isAnimating).toBe(true);
      expect(ctrl.badgeAppearing).toBe(true);
    });
  });
});
