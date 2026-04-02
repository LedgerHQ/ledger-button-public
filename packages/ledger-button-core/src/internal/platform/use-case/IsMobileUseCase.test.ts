import { beforeEach, describe, expect, it, vi } from "vitest";

import { IsMobileUseCase } from "./IsMobileUseCase.js";

describe("IsMobileUseCase", () => {
  let useCase: IsMobileUseCase;

  beforeEach(() => {
    useCase = new IsMobileUseCase();
    vi.restoreAllMocks();
  });

  it("should return false when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);

    expect(useCase.execute()).toBe(false);
  });

  it.each([
    {
      description: "Android phone",
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      description: "iPhone",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    },
    {
      description: "iPad",
      userAgent:
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    },
    {
      description: "iPod",
      userAgent:
        "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    },
    {
      description: "Opera Mini",
      userAgent:
        "Opera/9.80 (Android; Opera Mini/36.2.2254/191.256; U; en) Presto/2.12.423 Version/12.16",
    },
    {
      description: "IEMobile",
      userAgent:
        "Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Mobile Safari/537.36 Edge/15.15254 IEMobile/11.0",
    },
    {
      description: "WPDesktop",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; WPDesktop) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18362",
    },
  ])("should return true for $description", ({ userAgent }) => {
    vi.stubGlobal("navigator", { userAgent });

    expect(useCase.execute()).toBe(true);
  });

  it.each([
    {
      description: "Chrome on Windows",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    {
      description: "Firefox on macOS",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    },
    {
      description: "Safari on macOS",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    },
    {
      description: "Chrome on Linux",
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  ])("should return false for $description", ({ userAgent }) => {
    vi.stubGlobal("navigator", { userAgent });

    expect(useCase.execute()).toBe(false);
  });
});
