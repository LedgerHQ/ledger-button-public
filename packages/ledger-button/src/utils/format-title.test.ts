import { describe, expect, it } from "vitest";

import { formatTitle } from "./format-title.js";

describe("formatTitle", () => {
  describe("no truncation needed", () => {
    it("returns the original string when shorter than maxLength", () => {
      expect(formatTitle("Short title")).toBe("Short title");
    });

    it("returns the original string when equal to maxLength", () => {
      expect(formatTitle("a".repeat(30))).toBe("a".repeat(30));
    });

    it("returns an empty string as-is", () => {
      expect(formatTitle("")).toBe("");
    });
  });

  describe("truncation", () => {
    it("truncates and appends ellipsis when longer than maxLength", () => {
      expect(
        formatTitle("Super loooooooooooooooooooooooooooooong Account name"),
      ).toBe("Super looooooooooooooooooooooo…");
    });

    it("truncates at exactly 31 characters", () => {
      expect(formatTitle("a".repeat(31))).toBe(`${"a".repeat(30)}…`);
    });

    it("respects a custom maxLength", () => {
      expect(formatTitle("Hello World", 5)).toBe("Hello…");
    });
  });
});
