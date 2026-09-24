import { animate } from "motion";

export type AnimationInstance = ReturnType<typeof animate>;

export const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 240,
  damping: 40,
  mass: 1,
};

/**
 * Closed resting transforms, shared between the stylesheet and the animation
 * keyframes so an animation can never start from somewhere else than where the
 * stylesheet parked the element.
 */
export const PANEL_CLOSED_TRANSFORM = "translateX(100%)";
export const BOTTOM_CLOSED_TRANSFORM = "translateY(100%)";

export interface ContainerAnimation {
  /** Resolves once the container reached its open state. */
  open(container: HTMLElement): Promise<void>;
  close(container: HTMLElement): Promise<void>;
  cancel(): void;
}
