import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { languages } from "../../../context/language-context.js";
import { getLanguageDisplayName } from "../../../context/utils/language-utils.js";
import { PreferenceLanguageController } from "./preference-language-controller.js";

function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

function createMockLanguageContext(currentLanguage = "en") {
  return {
    currentLanguage,
    setCurrentLanguage: vi.fn(),
  };
}

function createMockCore() {
  return {
    trackLanguageChanged: vi.fn().mockResolvedValue(undefined),
  };
}

describe("PreferenceLanguageController", () => {
  let host: ReactiveControllerHost;

  beforeEach(() => {
    host = createMockHost();
  });

  it("should register itself with the host", () => {
    const languageContext = createMockLanguageContext();
    const core = createMockCore();
    new PreferenceLanguageController(
      host,
      languageContext as never,
      core as never,
    );

    expect(host.addController).toHaveBeenCalledWith(expect.any(Object));
  });

  describe("currentLanguage", () => {
    it("should return the current language from the context", () => {
      const languageContext = createMockLanguageContext("fr");
      const core = createMockCore();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
      );

      expect(controller.currentLanguage).toBe("fr");
    });
  });

  describe("languageOptions", () => {
    it("should return one option per supported language", () => {
      const languageContext = createMockLanguageContext();
      const core = createMockCore();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
      );

      expect(controller.languageOptions).toHaveLength(languages.length);
    });

    it("should include key and displayName for each option", () => {
      const languageContext = createMockLanguageContext();
      const core = createMockCore();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
      );

      const enOption = controller.languageOptions.find((o) => o.key === "en");
      expect(enOption).toBeDefined();
      expect(enOption?.displayName).toBe(getLanguageDisplayName("en"));
    });
  });

  describe("selectLanguage", () => {
    it("should call setCurrentLanguage on the context with the given code", () => {
      const languageContext = createMockLanguageContext();
      const core = createMockCore();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
      );

      controller.selectLanguage("fr");

      expect(languageContext.setCurrentLanguage).toHaveBeenCalledWith("fr");
    });

    it("should request a host update after selecting a language", () => {
      const languageContext = createMockLanguageContext();
      const core = createMockCore();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
      );

      controller.selectLanguage("fr");

      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it("should not track or apply when selecting the current language", () => {
      const languageContext = createMockLanguageContext("en");
      const core = createMockCore();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
      );

      controller.selectLanguage("en");

      expect(languageContext.setCurrentLanguage).not.toHaveBeenCalled();
      expect(core.trackLanguageChanged).not.toHaveBeenCalled();
      expect(host.requestUpdate).not.toHaveBeenCalled();
    });

    it("should track language_changed when the selection changes", () => {
      const languageContext = createMockLanguageContext("en");
      const core = createMockCore();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
      );

      controller.selectLanguage("fr");

      expect(core.trackLanguageChanged).toHaveBeenCalledWith("fr");
    });
  });

});
