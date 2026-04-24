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

describe("PreferenceLanguageController", () => {
  let host: ReactiveControllerHost;

  beforeEach(() => {
    host = createMockHost();
  });

  it("should register itself with the host", () => {
    const languageContext = createMockLanguageContext();
    new PreferenceLanguageController(host, languageContext as never);

    expect(host.addController).toHaveBeenCalledWith(expect.any(Object));
  });

  describe("currentLanguage", () => {
    it("should return the current language from the context", () => {
      const languageContext = createMockLanguageContext("fr");
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
      );

      expect(controller.currentLanguage).toBe("fr");
    });
  });

  describe("languageOptions", () => {
    it("should return one option per supported language", () => {
      const languageContext = createMockLanguageContext();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
      );

      expect(controller.languageOptions).toHaveLength(languages.length);
    });

    it("should include key and displayName for each option", () => {
      const languageContext = createMockLanguageContext();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
      );

      const enOption = controller.languageOptions.find((o) => o.key === "en");
      expect(enOption).toBeDefined();
      expect(enOption?.displayName).toBe(getLanguageDisplayName("en"));
    });
  });

  describe("selectLanguage", () => {
    it("should call setCurrentLanguage on the context with the given code", () => {
      const languageContext = createMockLanguageContext();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
      );

      controller.selectLanguage("fr");

      expect(languageContext.setCurrentLanguage).toHaveBeenCalledWith("fr");
    });

    it("should request a host update after selecting a language", () => {
      const languageContext = createMockLanguageContext();
      const controller = new PreferenceLanguageController(
        host,
        languageContext as never,
      );

      controller.selectLanguage("fr");

      expect(host.requestUpdate).toHaveBeenCalled();
    });
  });
});
