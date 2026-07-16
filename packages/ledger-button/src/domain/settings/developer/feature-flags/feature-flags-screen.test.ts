/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../../components/index.js", () => ({}));

import { FeatureFlagsScreen } from "./feature-flags-screen.js";

function createMockCore(overrides?: { solana?: boolean }) {
  const featureFlags = { solana: overrides?.solana ?? false };

  return {
    getFeatureFlags: vi.fn().mockReturnValue(featureFlags),
    setFeatureFlag: vi.fn((flag: "solana", enabled: boolean) => {
      featureFlags[flag] = enabled;
    }),
  };
}

function createMockLanguages() {
  return {
    currentTranslation: {
      settings: {
        featureFlags: {
          title: "Feature Flags",
          solana: {
            title: "Solana",
          },
        },
      },
    },
  };
}

function createFeatureFlagsScreen(
  overrides: Partial<
    Pick<FeatureFlagsScreen, "languages" | "coreContext">
  > = {},
) {
  const el = new FeatureFlagsScreen();
  el.languages = (overrides.languages ?? createMockLanguages()) as never;
  el.coreContext = (overrides.coreContext ?? createMockCore()) as never;
  el.navigation = { navigateTo: vi.fn() } as never;
  el.destinations = {} as never;
  return el;
}

describe("FeatureFlagsScreen", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("rendering", () => {
    test("should render the Solana toggle label", () => {
      const el = createFeatureFlagsScreen();
      (el as any).solanaEnabled = false;
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Solana");
    });
  });

  describe("handleSolanaToggleChange", () => {
    test("should enable the Solana feature flag", () => {
      const mockCore = createMockCore();
      const el = createFeatureFlagsScreen({ coreContext: mockCore as never });

      (el as any).handleSolanaToggleChange({ detail: { checked: true } });

      expect(mockCore.setFeatureFlag).toHaveBeenCalledWith("solana", true);
      expect((el as any).solanaEnabled).toBe(true);
    });

    test("should disable the Solana feature flag", () => {
      const mockCore = createMockCore({ solana: true });
      const el = createFeatureFlagsScreen({ coreContext: mockCore as never });
      (el as any).solanaEnabled = true;

      (el as any).handleSolanaToggleChange({ detail: { checked: false } });

      expect(mockCore.setFeatureFlag).toHaveBeenCalledWith("solana", false);
      expect((el as any).solanaEnabled).toBe(false);
    });
  });
});
