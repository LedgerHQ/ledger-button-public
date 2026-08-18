import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeviceManagementKitService } from "@internal/device/service/DeviceManagementKitService";

import type { IsMobileUseCase } from "./IsMobileUseCase";
import { IsSupportedPlatformUseCase } from "./IsSupportedPlatformUseCase";

describe("IsSupportedPlatformUseCase", () => {
  let useCase: IsSupportedPlatformUseCase;
  let mockIsMobile: { execute: ReturnType<typeof vi.fn> };
  let mockDeviceManagementKitService: {
    dmk: { isEnvironmentSupported: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    mockIsMobile = { execute: vi.fn() };
    mockDeviceManagementKitService = {
      dmk: { isEnvironmentSupported: vi.fn() },
    };

    useCase = new IsSupportedPlatformUseCase(
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
      mockIsMobile as unknown as IsMobileUseCase,
    );
  });

  it("should return true when platform is mobile", () => {
    mockIsMobile.execute.mockReturnValue(true);
    mockDeviceManagementKitService.dmk.isEnvironmentSupported.mockReturnValue(
      false,
    );

    expect(useCase.execute()).toBe(true);
  });

  it("should return true when environment supports WebHID", () => {
    mockIsMobile.execute.mockReturnValue(false);
    mockDeviceManagementKitService.dmk.isEnvironmentSupported.mockReturnValue(
      true,
    );

    expect(useCase.execute()).toBe(true);
  });

  it("should return true when both mobile and WebHID are supported", () => {
    mockIsMobile.execute.mockReturnValue(true);
    mockDeviceManagementKitService.dmk.isEnvironmentSupported.mockReturnValue(
      true,
    );

    expect(useCase.execute()).toBe(true);
  });

  it("should return false when neither mobile nor WebHID is supported", () => {
    mockIsMobile.execute.mockReturnValue(false);
    mockDeviceManagementKitService.dmk.isEnvironmentSupported.mockReturnValue(
      false,
    );

    expect(useCase.execute()).toBe(false);
  });

  it("should short-circuit and not check WebHID when mobile is true", () => {
    mockIsMobile.execute.mockReturnValue(true);

    useCase.execute();

    expect(
      mockDeviceManagementKitService.dmk.isEnvironmentSupported,
    ).not.toHaveBeenCalled();
  });
});
