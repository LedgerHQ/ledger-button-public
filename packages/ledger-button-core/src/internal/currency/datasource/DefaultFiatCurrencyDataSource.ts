import { inject, injectable } from "inversify";
import type { Either } from "purify-ts";
import { Left, Right } from "purify-ts";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { Config } from "@internal/config/model/config";
import { networkModuleTypes } from "@internal/network/di/networkModuleTypes";
import type { NetworkServiceOpts } from "@internal/network/model/types";
import type { NetworkService } from "@internal/network/NetworkService";

import type { FiatCurrencyDataSource } from "./FiatCurrencyDataSource";
import type { FiatCurrency } from "./fiatCurrencyTypes";

@injectable()
export class DefaultFiatCurrencyDataSource implements FiatCurrencyDataSource {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  async getSupportedFiatCurrencies(): Promise<Either<Error, FiatCurrency[]>> {
    const requestUrl = `${this.config.getCounterValueUrl()}/v3/supported/fiat/detailed`;
    const response = await this.networkService.get<FiatCurrency[]>(requestUrl);

    if (response.isLeft()) {
      return Left(new Error("Failed to fetch supported fiat currencies"));
    }

    return Right(response.extract() as FiatCurrency[]);
  }
}
