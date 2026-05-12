import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../../../config/model/config.js";
import type { NetworkService } from "../../../network/NetworkService.js";
import { DefaultFiatCurrencyDataSource } from "./DefaultFiatCurrencyDataSource.js";
import type { FiatCurrency } from "./fiatCurrencyTypes.js";

const MOCK_CURRENCIES: FiatCurrency[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Pound Sterling" },
];

describe("DefaultFiatCurrencyDataSource", () => {
  let dataSource: DefaultFiatCurrencyDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;

  const mockCounterValueUrl = "https://countervalue.api.test";

  beforeEach(() => {
    mockNetworkService = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as NetworkService<unknown>;

    mockConfig = {
      getCounterValueUrl: vi.fn().mockReturnValue(mockCounterValueUrl),
    } as unknown as Config;

    dataSource = new DefaultFiatCurrencyDataSource(
      mockNetworkService,
      mockConfig,
    );
  });

  describe("getSupportedFiatCurrencies", () => {
    it("should call the correct endpoint", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(MOCK_CURRENCIES),
      );

      await dataSource.getSupportedFiatCurrencies();

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCounterValueUrl}/v3/supported/fiat/detailed`,
      );
    });

    it("should return the list of supported fiat currencies on success", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(MOCK_CURRENCIES),
      );

      const result = await dataSource.getSupportedFiatCurrencies();

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual(MOCK_CURRENCIES);
    });

    it("should return Left when the network request fails", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Left(new Error("Network request failed")),
      );

      const result = await dataSource.getSupportedFiatCurrencies();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect((result.extract() as Error).message).toBe(
          "Failed to fetch supported fiat currencies",
        );
      }
    });
  });
});
