import { Either } from "purify-ts";

import { AlpacaServiceError } from "../model/error.js";
import { AlpacaBalanceRequest, AlpacaBalanceResponse } from "../model/types.js";

export interface AlpacaService {
  getBalance(request: AlpacaBalanceRequest): Promise<Either<AlpacaServiceError, AlpacaBalanceResponse>>;
}
