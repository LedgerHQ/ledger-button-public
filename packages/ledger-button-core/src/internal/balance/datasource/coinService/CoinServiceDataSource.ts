import { Either } from "purify-ts";

import {
  CoinServiceBalance,
  CoinServiceFeeEstimationResponse,
  CoinServiceTransactionIntent,
} from "./coinServiceTypes.js";

export interface CoinServiceDataSource {
  getBalanceForAddressAndCurrencyId(
    address: string,
    currencyId: string,
  ): Promise<Either<Error, CoinServiceBalance[]>>;

  estimateTransactionFee(
    network: string,
    intent: CoinServiceTransactionIntent,
  ): Promise<Either<Error, CoinServiceFeeEstimationResponse>>;
}
