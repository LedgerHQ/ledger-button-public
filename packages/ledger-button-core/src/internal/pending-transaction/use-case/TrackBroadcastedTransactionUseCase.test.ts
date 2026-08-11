import { Left, Maybe, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SignFlowStatus } from "@api/model/signing/SignFlowStatus.js";
import type { SignRawTransactionParams } from "@api/model/signing/SignRawTransactionParams.js";
import type { SignTransactionParams } from "@api/model/signing/SignTransactionParams.js";
import type { SignSolanaTransactionParams } from "@api/model/signing/solana/SignSolanaTransactionParams.js";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";
import { ContextService } from "@internal/context/ContextService.js";

import type { PendingTransactionController } from "../controller/PendingTransactionController.js";
import { TrackBroadcastedTransactionUseCase } from "./TrackBroadcastedTransactionUseCase.js";

function createMockLogger() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    fatal: vi.fn(),
    subscribers: [],
  };
}

function createMockLoggerFactory() {
  return vi.fn().mockReturnValue(createMockLogger());
}

function createMockController(): PendingTransactionController {
  return {
    track: vi.fn(),
    observePendingTransactions: vi.fn(),
    registerBroadcastedTransaction: vi.fn(),
    observeBroadcastedTransaction: vi.fn(),
  };
}

function createMockContextService() {
  return {
    observeContext: vi.fn(),
    getContext: vi.fn().mockReturnValue({
      chainId: 1,
      selectedAccounts: new Map([
        [
          "ethereum",
          {
            freshAddress: "0x1234",
            currencyId: "ethereum",
            ticker: "ETH",
            name: "Ethereum",
          },
        ],
      ]),
    }),
    onEvent: vi.fn(),
  };
}

function createMockCalDataSource() {
  return {
    getTokenInformation: vi.fn(),
    getCurrencyInformation: vi.fn().mockResolvedValue(
      Right({
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        decimals: 18,
        transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
      }),
    ),
  };
}

function createMockBlockchainProviderManager(): BlockchainProviderManager {
  return {
    init: vi.fn(),
    setSelectedAccounts: vi.fn(),
    setNetwork: vi.fn(),
    resolveBlockchainFamily: vi.fn().mockReturnValue(Maybe.empty()),
    resolveNetwork: vi.fn().mockReturnValue(Maybe.empty()),
    resolveCurrencyId: vi.fn().mockReturnValue(Maybe.empty()),
    getNativeDecimals: vi.fn().mockImplementation((currencyId: string) => {
      if (currencyId === "solana") {
        return Maybe.of(9);
      }
      if (currencyId === "ethereum") {
        return Maybe.of(18);
      }
      return Maybe.empty();
    }),
  };
}

const successBroadcastStatus: SignFlowStatus = {
  signType: "transaction",
  status: "success",
  data: {
    hash: "0xabc123",
    rawTransaction: new Uint8Array(),
    signedRawTransaction: "0xsigned",
  },
};

const signTransactionParams: SignTransactionParams = {
  transaction: {
    chainId: 1,
    data: "0x",
    to: "0x5678",
    value: "1000000000000000000",
  },
  method: "eth_sendTransaction",
  broadcast: true,
};

describe("TrackBroadcastedTransactionUseCase", () => {
  let useCase: TrackBroadcastedTransactionUseCase;
  let mockController: PendingTransactionController;
  let mockContextService: ReturnType<typeof createMockContextService>;
  let mockCalDataSource: ReturnType<typeof createMockCalDataSource>;
  let mockBlockchainProviderManager: BlockchainProviderManager;

  beforeEach(() => {
    mockController = createMockController();
    mockContextService = createMockContextService();
    mockCalDataSource = createMockCalDataSource();
    mockBlockchainProviderManager = createMockBlockchainProviderManager();

    useCase = new TrackBroadcastedTransactionUseCase(
      mockController,
      mockContextService as unknown as ContextService,
      mockCalDataSource,
      mockBlockchainProviderManager,
      createMockLoggerFactory(),
    );
  });

  it("awaits CAL before registering the transaction", async () => {
    let calResolve: () => void = () => undefined;
    mockCalDataSource.getCurrencyInformation.mockReturnValue(
      new Promise((resolve) => {
        calResolve = () =>
          resolve(
            Right({
              id: "ethereum",
              name: "Ethereum",
              ticker: "ETH",
              decimals: 18,
              transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
            }),
          );
      }),
    );

    const executePromise = useCase.execute(
      successBroadcastStatus,
      signTransactionParams,
    );

    expect(mockController.registerBroadcastedTransaction).not.toHaveBeenCalled();

    calResolve();
    await executePromise;

    expect(mockController.registerBroadcastedTransaction).toHaveBeenCalledTimes(
      1,
    );
    expect(mockController.registerBroadcastedTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        hash: "0xabc123",
        chainId: 1,
        address: "0x1234",
        type: "sent",
        value: "1000000000000000000",
        ticker: "ETH",
        currencyName: "Ethereum",
        ledgerId: "ethereum",
        explorerUrl: "https://etherscan.io/tx/0xabc123",
      }),
    );
  });

  it("should skip non-success statuses", async () => {
    const errorStatus: SignFlowStatus = {
      signType: "transaction",
      status: "error",
      error: new Error("failed"),
    };

    await useCase.execute(errorStatus, signTransactionParams);

    expect(mockController.registerBroadcastedTransaction).not.toHaveBeenCalled();
  });

  it("should skip non-broadcasted results (signed only)", async () => {
    const signedOnlyStatus: SignFlowStatus = {
      signType: "transaction",
      status: "success",
      data: {
        rawTransaction: new Uint8Array(),
        signedRawTransaction: "0xsigned",
      },
    };

    await useCase.execute(signedOnlyStatus, signTransactionParams);

    expect(mockController.registerBroadcastedTransaction).not.toHaveBeenCalled();
  });

  it("should skip message signing results", async () => {
    const messageStatus: SignFlowStatus = {
      signType: "personal-sign",
      status: "success",
      data: { signature: "0xsig" },
    };

    await useCase.execute(messageStatus, ["0x1234", "hello", "personal_sign"]);

    expect(mockController.registerBroadcastedTransaction).not.toHaveBeenCalled();
  });

  it("should skip when no selected account", async () => {
    mockContextService.getContext.mockReturnValue({
      chainId: 1,
      selectedAccounts: new Map(),
    });

    await useCase.execute(successBroadcastStatus, signTransactionParams);

    expect(mockController.registerBroadcastedTransaction).not.toHaveBeenCalled();
  });

  it("should use fallback currency info when CalDataSource fails", async () => {
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Left(new Error("CAL unavailable")),
    );

    await useCase.execute(successBroadcastStatus, signTransactionParams);

    expect(mockController.registerBroadcastedTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        ticker: "ETHEREUM",
        currencyName: "ethereum",
        explorerUrl: undefined,
      }),
    );
  });

  it("should format EVM value using provider native decimals when CAL fails", async () => {
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Left(new Error("CAL unavailable")),
    );

    await useCase.execute(successBroadcastStatus, signTransactionParams);

    // 1000000000000000000 scaled by the EVM provider's 18 decimals
    expect(mockController.registerBroadcastedTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ formattedValue: "1" }),
    );
  });

  it("should leave the formatted value unset when no source resolves decimals", async () => {
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Left(new Error("CAL unavailable")),
    );
    vi.mocked(mockBlockchainProviderManager.getNativeDecimals).mockReturnValue(
      Maybe.empty(),
    );

    await useCase.execute(successBroadcastStatus, signTransactionParams);

    expect(mockController.registerBroadcastedTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "1000000000000000000",
        formattedValue: undefined,
      }),
    );
  });

  it("scopes a Solana broadcast to the Solana account even when EVM is the active family", async () => {
    mockContextService.getContext.mockReturnValue({
      chainId: 1,
      activeFamily: "ethereum",
      selectedAccounts: new Map([
        [
          "ethereum",
          {
            freshAddress: "0x1234",
            currencyId: "ethereum",
            ticker: "ETH",
            name: "Ethereum",
          },
        ],
        [
          "solana",
          {
            freshAddress: "So1ana1111",
            currencyId: "solana",
            ticker: "SOL",
            name: "Solana",
          },
        ],
      ]),
    });
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Right({
        id: "solana",
        name: "Solana",
        ticker: "SOL",
        decimals: 9,
        transactionExplorerUrlTemplate: "https://solscan.io/tx/${hash}",
      }),
    );

    const solanaParams: SignSolanaTransactionParams = {
      kind: "solana-transaction",
      address: "So1ana1111",
      transaction: new Uint8Array([1, 2, 3]),
    };

    await useCase.execute(successBroadcastStatus, solanaParams);

    expect(mockController.registerBroadcastedTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        hash: "0xabc123",
        address: "So1ana1111",
        ledgerId: "solana",
        ticker: "SOL",
        currencyName: "Solana",
        chainId: 0,
        explorerUrl: "https://solscan.io/tx/0xabc123",
        value: undefined,
        formattedValue: undefined,
      }),
    );
  });

  it("should leave the value unset for raw transaction params", async () => {
    const rawParams: SignRawTransactionParams = {
      transaction: "0xdeadbeef",
      method: "eth_sendRawTransaction",
      broadcast: true,
    };

    await useCase.execute(successBroadcastStatus, rawParams);

    expect(mockController.registerBroadcastedTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        value: undefined,
        formattedValue: undefined,
      }),
    );
  });
});
