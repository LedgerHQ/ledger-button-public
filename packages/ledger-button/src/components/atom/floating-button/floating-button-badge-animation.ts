import { animate } from "motion";

import { type AnimationInstance } from "../modal/animation-types.js";

const ELASTIC_SPRING = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
};

const SWING_SPRING = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

export class FloatingButtonBadgeAnimation {
  private animation: AnimationInstance | null = null;

  async shrinkOut(el: HTMLElement): Promise<void> {
    this.cancel();

    await new Promise<void>((resolve) => {
      this.animation = animate(
        el,
        { scale: [1, 0] },
        {
          ...SWING_SPRING,
          duration: 0.8,
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
        { scale: [0, 1] },
        {
          ...ELASTIC_SPRING,
          duration: 1,
          onComplete: () => resolve(),
        },
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
