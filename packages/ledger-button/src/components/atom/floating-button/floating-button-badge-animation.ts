import { animate, type AnimationOptions } from "motion";

import { type AnimationInstance } from "../modal/animation-types";

const ELASTIC_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 18,
  mass: 1,
};

export class FloatingButtonBadgeAnimation {
  private animation: AnimationInstance | null = null;

  async shrinkOut(el: HTMLElement): Promise<void> {
    this.cancel();

    await new Promise<void>((resolve) => {
      // Cast the target object to 'any' to bypass the translate/string incompatibility
      this.animation = animate(
        el,
        { scale: [1, 1.15, 0] },
        {
          duration: 0.4,
          times: [0, 0.2, 1],
          ease: ["easeOut", "easeIn"],
          onComplete: () => resolve(),
        },
      );
    });

    this.animation = null;
  }

  async growIn(el: HTMLElement): Promise<void> {
    this.cancel();

    await new Promise<void>((resolve) => {
      this.animation = animate(
        el,
        { scale: 1 },
        {
          ...ELASTIC_SPRING,
          from: 0,
          onComplete: () => resolve(),
        } as AnimationOptions, // Cast options to help with overload matching
      );
    });

    this.animation = null;
  }

  cancel(): void {
    if (this.animation) {
      this.animation.cancel();
      this.animation = null;
    }
  }
}
