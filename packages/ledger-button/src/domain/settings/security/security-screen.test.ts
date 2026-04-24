/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../components/index.js", () => ({}));
vi.mock("../../../components/atom/toggle/ledger-toggle.js", () => ({}));

import { SecurityScreen } from "./security-screen.js";

function createMockCoreContext(overrides: { hasConsent?: boolean } = {}) {
  return {
    hasConsent: vi.fn().mockResolvedValue(overrides.hasConsent ?? false),
    giveConsent: vi.fn().mockResolvedValue(undefined),
    removeConsent: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockLanguages(overrides?: { settings?: unknown }) {
  return {
    currentTranslation: {
      settings: overrides?.settings ?? {
        title: "Settings",
        securityConfidentiality: {
          analytics: {
            title: "Analytics",
            description:
              "Enable Ledger to collect app usage data to help measure performance.",
          },
        },
        helpSupport: "Help & Support",
      },
    },
  };
}

function createSecurityScreen(
  overrides: {
    coreContext?: unknown;
    languages?: unknown;
  } = {},
) {
  const el = new SecurityScreen();
  el.coreContext = (overrides.coreContext ?? createMockCoreContext()) as never;
  el.languages = (overrides.languages ?? createMockLanguages()) as never;
  return el;
}

describe("SecurityScreen", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("rendering", () => {
    test("should render analytics section", () => {
      const el = createSecurityScreen();
      const rendered = el.render();

      expect(rendered).toBeDefined();
    });

    test("should use translation labels for analytics", () => {
      const el = createSecurityScreen();
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Analytics");
      expect(renderedString).toContain("Enable Ledger");
    });
  });

  describe("consent initialization", () => {
    test("should set analyticsEnabled to true when user has consent", async () => {
      const mockCore = createMockCoreContext({ hasConsent: true });
      const el = createSecurityScreen({ coreContext: mockCore });

      await el.connectedCallback();

      expect(mockCore.hasConsent).toHaveBeenCalled();
      expect((el as any).analyticsEnabled).toBe(true);
    });

    test("should set analyticsEnabled to false when user has no consent", async () => {
      const mockCore = createMockCoreContext({ hasConsent: false });
      const el = createSecurityScreen({ coreContext: mockCore });

      await el.connectedCallback();

      expect(mockCore.hasConsent).toHaveBeenCalled();
      expect((el as any).analyticsEnabled).toBe(false);
    });
  });

  describe("handleToggleChange", () => {
    test("should give consent and enable analytics when toggled on", async () => {
      const mockCore = createMockCoreContext();
      const el = createSecurityScreen({ coreContext: mockCore });

      const event = new CustomEvent("ledger-toggle-change", {
        detail: { checked: true },
      });

      await (el as any).handleToggleChange(event);

      expect(mockCore.giveConsent).toHaveBeenCalled();
      expect(mockCore.removeConsent).not.toHaveBeenCalled();
      expect((el as any).analyticsEnabled).toBe(true);
    });

    test("should remove consent and disable analytics when toggled off", async () => {
      const mockCore = createMockCoreContext();
      const el = createSecurityScreen({ coreContext: mockCore });

      const event = new CustomEvent("ledger-toggle-change", {
        detail: { checked: false },
      });

      await (el as any).handleToggleChange(event);

      expect(mockCore.removeConsent).toHaveBeenCalled();
      expect(mockCore.giveConsent).not.toHaveBeenCalled();
      expect((el as any).analyticsEnabled).toBe(false);
    });
  });
});
