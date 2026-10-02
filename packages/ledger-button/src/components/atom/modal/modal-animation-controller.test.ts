import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ModalAnimationController } from "./modal-animation-controller";

const { animateMock } = vi.hoisted(() => ({ animateMock: vi.fn() }));

vi.mock("motion", () => ({
  animate: animateMock,
}));

// `shared/navigation` only provides the duration here, but it also registers
// every screen component, which a node test environment cannot load.
vi.mock("../../../shared/navigation", () => ({
  ANIMATION_DELAY: 300,
}));

const OPEN_CLASS = "modal-wrapper--open";
const BACKDROP_SETTLED_CLASS = "modal-backdrop--settled";
const CONTAINER_SETTLED_CLASS = "modal-container--settled";

type FakeElement = HTMLElement & { classes: Set<string> };

function createElement(): FakeElement {
  const classes = new Set<string>();

  return {
    classes,
    children: [],
    style: {} as CSSStyleDeclaration,
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
    },
  } as unknown as FakeElement;
}

function createElements() {
  return {
    backdrop: createElement(),
    container: createElement(),
    wrapper: createElement(),
  };
}

function createHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

function startedAnimations() {
  return animateMock.mock.results.map(
    (result) => result.value as { cancel: ReturnType<typeof vi.fn> },
  );
}

async function flushAnimations(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("ModalAnimationController", () => {
  let controller: ModalAnimationController;
  let elements: ReturnType<typeof createElements>;

  beforeEach(() => {
    animateMock.mockImplementation(
      (
        _element: unknown,
        _keyframes: unknown,
        options?: { onComplete?: () => void },
      ) => {
        options?.onComplete?.();
        return { cancel: vi.fn(), stop: vi.fn() };
      },
    );
    controller = new ModalAnimationController(createHost());
    elements = createElements();
  });

  describe("open", () => {
    it("should reveal the wrapper", () => {
      controller.animateOpen(elements, "center");

      expect(elements.wrapper.classes.has(OPEN_CLASS)).toBe(true);
    });

    it("should leave the elements in their closed state while animating", () => {
      controller.animateOpen(elements, "center");

      expect(elements.backdrop.classes.has(BACKDROP_SETTLED_CLASS)).toBe(false);
      expect(elements.container.classes.has(CONTAINER_SETTLED_CLASS)).toBe(
        false,
      );
    });

    it("should pin the open state once the animation completes", async () => {
      controller.animateOpen(elements, "center");
      await flushAnimations();

      expect(elements.backdrop.classes.has(BACKDROP_SETTLED_CLASS)).toBe(true);
      expect(elements.container.classes.has(CONTAINER_SETTLED_CLASS)).toBe(
        true,
      );
    });
  });

  describe("opening an already open modal", () => {
    it("should not restart the running animation", () => {
      controller.animateOpen(elements, "center");
      const running = startedAnimations();
      const callCount = animateMock.mock.calls.length;

      controller.animateOpen(elements, "center");

      expect(animateMock.mock.calls.length).toBe(callCount);
      for (const animation of running) {
        expect(animation.cancel).not.toHaveBeenCalled();
      }
    });

    it("should pin the open state on the elements rendered by a mode switch", () => {
      controller.animateOpen(elements, "center");

      const swapped = createElements();
      controller.animateOpen(swapped, "panel");

      expect(swapped.wrapper.classes.has(OPEN_CLASS)).toBe(true);
      expect(swapped.container.classes.has(CONTAINER_SETTLED_CLASS)).toBe(true);
    });
  });

  describe("close", () => {
    it("should drop the open state", async () => {
      controller.animateOpen(elements, "center");
      await flushAnimations();

      await controller.animateClose(elements, "center");

      expect(elements.wrapper.classes.has(OPEN_CLASS)).toBe(false);
      expect(elements.backdrop.classes.has(BACKDROP_SETTLED_CLASS)).toBe(false);
      expect(elements.container.classes.has(CONTAINER_SETTLED_CLASS)).toBe(
        false,
      );
    });

    it("should ignore an open animation completing after the modal closed", async () => {
      const completions: Array<() => void> = [];
      animateMock.mockImplementation(
        (
          _element: unknown,
          _keyframes: unknown,
          options?: { onComplete?: () => void },
        ) => {
          if (options?.onComplete) {
            completions.push(options.onComplete);
          }
          return { cancel: vi.fn(), stop: vi.fn() };
        },
      );

      controller.animateOpen(elements, "center");
      const openCompletions = completions.splice(0);

      const closing = controller.animateClose(elements, "center");
      completions.splice(0).forEach((complete) => complete());
      await closing;

      openCompletions.forEach((complete) => complete());
      await flushAnimations();

      expect(elements.container.classes.has(CONTAINER_SETTLED_CLASS)).toBe(
        false,
      );
    });

    it("should animate again on reopen", async () => {
      controller.animateOpen(elements, "center");
      await controller.animateClose(elements, "center");
      const callCount = animateMock.mock.calls.length;

      controller.animateOpen(elements, "center");

      expect(animateMock.mock.calls.length).toBeGreaterThan(callCount);
    });
  });
});
