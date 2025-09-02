export class AlpacaServiceError extends Error {
  constructor(
    public readonly code:
      | "NETWORK_ERROR"
      | "INVALID_ADDRESS"
      | "UNSUPPORTED_CHAIN"
      | "API_ERROR"
      | "BALANCE_FETCH_ERROR"
      | "TOKEN_FETCH_ERROR"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "AlpacaServiceError";
  }

  static networkError(
    message: string,
    originalError?: unknown,
  ): AlpacaServiceError {
    return new AlpacaServiceError("NETWORK_ERROR", message, originalError);
  }

  static invalidAddress(address: string): AlpacaServiceError {
    return new AlpacaServiceError(
      "INVALID_ADDRESS",
      `Invalid address format: ${address}`,
    );
  }

  static unsupportedChain(currencyId: string): AlpacaServiceError {
    return new AlpacaServiceError(
      "UNSUPPORTED_CHAIN",
      `Unsupported chain: ${currencyId}`,
    );
  }

  static apiError(
    message: string,
    originalError?: unknown,
  ): AlpacaServiceError {
    return new AlpacaServiceError("API_ERROR", message, originalError);
  }

  static balanceFetchError(
    address: string,
    currencyId: string,
    originalError?: unknown,
  ): AlpacaServiceError {
    return new AlpacaServiceError(
      "BALANCE_FETCH_ERROR",
      `Failed to fetch balance for address ${address} on ${currencyId}`,
      originalError,
    );
  }

  static tokenFetchError(
    address: string,
    currencyId: string,
    originalError?: unknown,
  ): AlpacaServiceError {
    return new AlpacaServiceError(
      "TOKEN_FETCH_ERROR",
      `Failed to fetch token balances for address ${address} on ${currencyId}`,
      originalError,
    );
  }

  static unknownError(
    message: string,
    originalError?: unknown,
  ): AlpacaServiceError {
    return new AlpacaServiceError("UNKNOWN_ERROR", message, originalError);
  }
}
