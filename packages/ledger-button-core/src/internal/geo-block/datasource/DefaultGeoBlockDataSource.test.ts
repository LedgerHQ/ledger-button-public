import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DefaultGeoBlockDataSource } from "./DefaultGeoBlockDataSource";

const COUNTERVALUE_URL = "https://countervalues.example.com";

describe("DefaultGeoBlockDataSource", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let dataSource: DefaultGeoBlockDataSource;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    dataSource = new DefaultGeoBlockDataSource({
      getCounterValueUrl: () => COUNTERVALUE_URL,
    } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should probe the markets endpoint without retry", async () => {
    fetchMock.mockResolvedValue({ status: 200 });

    await dataSource.getProbeStatus();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${COUNTERVALUE_URL}/v3/markets`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it.each([200, 451, 500])("should return the %i status", async (status) => {
    fetchMock.mockResolvedValue({ status });

    const result = await dataSource.getProbeStatus();

    expect(result.extract()).toBe(status);
  });

  it("should return Nothing on a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await dataSource.getProbeStatus();

    expect(result.isNothing()).toBe(true);
  });

  it("should return Nothing when the probe times out", async () => {
    fetchMock.mockRejectedValue(new DOMException("timeout", "TimeoutError"));

    const result = await dataSource.getProbeStatus();

    expect(result.isNothing()).toBe(true);
  });
});
