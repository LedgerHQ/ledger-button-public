import { Just, Nothing } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CheckGeoBlockUseCase } from "./CheckGeoBlockUseCase";

describe("CheckGeoBlockUseCase", () => {
  let dataSource: { getProbeStatus: ReturnType<typeof vi.fn> };
  let handleGeoBlock: { execute: ReturnType<typeof vi.fn> };
  let useCase: CheckGeoBlockUseCase;

  beforeEach(() => {
    dataSource = { getProbeStatus: vi.fn() };
    handleGeoBlock = { execute: vi.fn() };
    useCase = new CheckGeoBlockUseCase(
      dataSource as never,
      handleGeoBlock as never,
    );
  });

  it("should hand the probe status to the shared use case", async () => {
    dataSource.getProbeStatus.mockResolvedValue(Just(451));

    await useCase.execute();

    expect(handleGeoBlock.execute).toHaveBeenCalledWith(451);
  });

  it("should hand any other status to the shared use case too", async () => {
    dataSource.getProbeStatus.mockResolvedValue(Just(200));

    await useCase.execute();

    expect(handleGeoBlock.execute).toHaveBeenCalledWith(200);
  });

  it("should fail open when the probe got no answer", async () => {
    dataSource.getProbeStatus.mockResolvedValue(Nothing);

    await expect(useCase.execute()).resolves.toBeUndefined();

    expect(handleGeoBlock.execute).not.toHaveBeenCalled();
  });
});
