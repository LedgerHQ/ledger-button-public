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
    handleGeoBlock.execute.mockReturnValue(true);

    const result = await useCase.execute();

    expect(handleGeoBlock.execute).toHaveBeenCalledWith(451);
    expect(result).toBe(true);
  });

  it("should return false when the shared use case does not block", async () => {
    dataSource.getProbeStatus.mockResolvedValue(Just(200));
    handleGeoBlock.execute.mockReturnValue(false);

    expect(await useCase.execute()).toBe(false);
  });

  it("should fail open when the probe got no answer", async () => {
    dataSource.getProbeStatus.mockResolvedValue(Nothing);

    const result = await useCase.execute();

    expect(handleGeoBlock.execute).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
