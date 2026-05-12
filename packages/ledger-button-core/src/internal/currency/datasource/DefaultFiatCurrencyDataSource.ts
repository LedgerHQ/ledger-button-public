import { inject, injectable } from "inversify";
import type { Either } from "purify-ts";
import { Left, Right } from "purify-ts";

import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import type { NetworkServiceOpts } from "../../network/model/types.js";
import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import type { NetworkService } from "../../network/NetworkService.js";
import type { FiatCurrencyDataSource } from "./FiatCurrencyDataSource.js";
import type { FiatCurrency } from "./fiatCurrencyTypes.js";

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
