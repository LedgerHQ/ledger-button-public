import { beforeEach, describe, expect, it, vi } from "vitest";

import { HandleGeoBlockUseCase } from "./HandleGeoBlockUseCase";

const createMockLogger = () => ({
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
});

describe("HandleGeoBlockUseCase", () => {
  let contextService: { onEvent: ReturnType<typeof vi.fn> };
  let useCase: HandleGeoBlockUseCase;

  beforeEach(() => {
    contextService = { onEvent: vi.fn() };
    useCase = new HandleGeoBlockUseCase(
      vi.fn(() => createMockLogger()) as never,
      contextService as never,
    );
  });

  describe("when the status is 451", () => {
    it("should flag the user as geo-blocked", () => {
      useCase.execute(451);

      expect(contextService.onEvent).toHaveBeenCalledWith({
        type: "geo_blocked",
      });
    });

    it("should return true", () => {
      expect(useCase.execute(451)).toBe(true);
    });
  });

  describe.each([200, 403, 500])("when the status is %i", (status) => {
    it("should not flag the user as geo-blocked", () => {
      useCase.execute(status);

      expect(contextService.onEvent).not.toHaveBeenCalled();
    });

    it("should return false", () => {
      expect(useCase.execute(status)).toBe(false);
    });
  });
});
