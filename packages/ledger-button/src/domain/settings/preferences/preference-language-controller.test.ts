import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { languages } from "../../../context/language-context";
import { getLanguageDisplayName } from "../../../context/utils/language-utils";
import { PreferenceLanguageController } from "./preference-language-controller";

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

function createMockNavigation() {
  return {
    navigateBack: vi.fn(),
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
    const navigation = createMockNavigation();
    new PreferenceLanguageController(
      host,
      languageContext as never,
      core as never,
      navigation as never,
    );

    expect(host.addController).toHaveBeenCalledWith(expect.any(Object));
  });

  describe("currentLanguage", () => {
    it("should return the current language from the context", () => {
      const languageContext = createMockLanguageContext("fr");
      const core = createMockCore();
      const navigation = createMockNavigation();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
        navigation as never,
      );

      expect(controller.currentLanguage).toBe("fr");
    });
  });

  describe("languageOptions", () => {
    it("should return one option per supported language", () => {
      const languageContext = createMockLanguageContext();
      const core = createMockCore();
      const navigation = createMockNavigation();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
        navigation as never,
      );

      expect(controller.languageOptions).toHaveLength(languages.length);
    });

    it("should include key and displayName for each option", () => {
      const languageContext = createMockLanguageContext();
      const core = createMockCore();
      const navigation = createMockNavigation();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
        navigation as never,
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
      const navigation = createMockNavigation();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
        navigation as never,
      );

      controller.selectLanguage("fr");

      expect(languageContext.setCurrentLanguage).toHaveBeenCalledWith("fr");
    });

    it("should navigate back after selecting a language", () => {
      const languageContext = createMockLanguageContext();
      const core = createMockCore();
      const navigation = createMockNavigation();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
        navigation as never,
      );

      controller.selectLanguage("fr");

      expect(navigation.navigateBack).toHaveBeenCalled();
    });

    it("should not track, apply or navigate back when selecting the current language", () => {
      const languageContext = createMockLanguageContext("en");
      const core = createMockCore();
      const navigation = createMockNavigation();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
        navigation as never,
      );

      controller.selectLanguage("en");

      expect(languageContext.setCurrentLanguage).not.toHaveBeenCalled();
      expect(core.trackLanguageChanged).not.toHaveBeenCalled();
      expect(navigation.navigateBack).not.toHaveBeenCalled();
    });

    it("should track language_changed when the selection changes", () => {
      const languageContext = createMockLanguageContext("en");
      const core = createMockCore();
      const navigation = createMockNavigation();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
        core as never,
        navigation as never,
      );

      controller.selectLanguage("fr");

      expect(core.trackLanguageChanged).toHaveBeenCalledWith("fr");
    });
  });

});
