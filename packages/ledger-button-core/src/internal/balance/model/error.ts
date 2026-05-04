import { LedgerButtonError } from "../../../api/errors/LedgerButtonError.js";

export class CoinServiceNetworkError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CoinServiceNetworkError", context);
  }
}

export class CoinServiceInvalidAddressError extends LedgerButtonError {
  constructor(address: string, context?: Record<string, unknown>) {
    super(
      `Invalid address format: ${address}`,
      "CoinServiceInvalidAddressError",
      { address, ...context },
    );
  }
}

export class CoinServiceUnsupportedChainError extends LedgerButtonError {
  constructor(currencyId: string, context?: Record<string, unknown>) {
    super(
      `Unsupported chain: ${currencyId}`,
      "CoinServiceUnsupportedChainError",
      { currencyId, ...context },
    );
  }
}

export class CoinServiceApiError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CoinServiceApiError", context);
  }
}

export class CoinServiceBalanceFetchError extends LedgerButtonError {
  constructor(
    address: string,
    currencyId: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Failed to fetch balance for address ${address} on ${currencyId}`,
      "CoinServiceBalanceFetchError",
      { address, currencyId, ...context },
    );
  }
}

export class CoinServiceTokenFetchError extends LedgerButtonError {
  constructor(
    address: string,
    currencyId: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `Failed to fetch token balances for address ${address} on ${currencyId}`,
      "CoinServiceTokenFetchError",
      { address, currencyId, ...context },
    );
  }
}

export class CoinServiceUnknownError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CoinServiceUnknownError", context);
  }
}

export class CoinServiceFeeEstimationError extends LedgerButtonError {
  constructor(network: string, context?: Record<string, unknown>) {
    super(
      `Failed to estimate transaction fee for ${network}`,
      "CoinServiceFeeEstimationError",
      { network, ...context },
    );
  }
}

export type CoinServiceServiceError =
  | CoinServiceNetworkError
  | CoinServiceInvalidAddressError
  | CoinServiceUnsupportedChainError
  | CoinServiceApiError
  | CoinServiceBalanceFetchError
  | CoinServiceTokenFetchError
  | CoinServiceFeeEstimationError
  | CoinServiceUnknownError;

export const CoinServiceServiceErrors = {
  networkError: (
    message: string,
    originalError?: unknown,
  ): CoinServiceNetworkError =>
    new CoinServiceNetworkError(message, { originalError }),

  invalidAddress: (address: string): CoinServiceInvalidAddressError =>
    new CoinServiceInvalidAddressError(address),

  unsupportedChain: (currencyId: string): CoinServiceUnsupportedChainError =>
    new CoinServiceUnsupportedChainError(currencyId),

  apiError: (message: string, originalError?: unknown): CoinServiceApiError =>
    new CoinServiceApiError(message, { originalError }),

  balanceFetchError: (
    address: string,
    currencyId: string,
    originalError?: unknown,
  ): CoinServiceBalanceFetchError =>
    new CoinServiceBalanceFetchError(address, currencyId, { originalError }),

  tokenFetchError: (
    address: string,
    currencyId: string,
    originalError?: unknown,
  ): CoinServiceTokenFetchError =>
    new CoinServiceTokenFetchError(address, currencyId, { originalError }),

  feeEstimationError: (
    network: string,
    originalError?: unknown,
  ): CoinServiceFeeEstimationError =>
    new CoinServiceFeeEstimationError(network, { originalError }),

  unknownError: (
    message: string,
    originalError?: unknown,
  ): CoinServiceUnknownError =>
    new CoinServiceUnknownError(message, { originalError }),
};
