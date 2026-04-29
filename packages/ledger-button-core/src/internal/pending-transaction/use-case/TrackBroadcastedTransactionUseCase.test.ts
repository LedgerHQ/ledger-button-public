import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { SignRawTransactionParams } from "../../../api/model/signing/SignRawTransactionParams.js";
import type { SignTransactionParams } from "../../../api/model/signing/SignTransactionParams.js";
import { ContextService } from "../../context/ContextService.js";
import type { PendingTransactionController } from "../controller/PendingTransactionController.js";
import type { PendingTransactionStorageService } from "../service/PendingTransactionStorageService.js";
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

function createMockStorageService(): PendingTransactionStorageService {
  return {
    add: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    remove: vi.fn(),
  };
}

function createMockController(): PendingTransactionController {
  return {
    track: vi.fn(),
    observePendingTransactions: vi.fn(),
  };
}

function createMockContextService() {
  return {
    observeContext: vi.fn(),
    getContext: vi.fn().mockReturnValue({
      chainId: 1,
      selectedAccount: {
        freshAddress: "0x1234",
        currencyId: "ethereum",
        ticker: "ETH",
        name: "Ethereum",
      },
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
  let mockStorageService: PendingTransactionStorageService;
  let mockController: PendingTransactionController;
  let mockContextService: ReturnType<typeof createMockContextService>;
  let mockCalDataSource: ReturnType<typeof createMockCalDataSource>;

  beforeEach(() => {
    mockStorageService = createMockStorageService();
    mockController = createMockController();
    mockContextService = createMockContextService();
    mockCalDataSource = createMockCalDataSource();

    useCase = new TrackBroadcastedTransactionUseCase(
      mockStorageService,
      mockController,
      mockContextService as unknown as ContextService,
      mockCalDataSource,
      createMockLoggerFactory(),
    );
  });

  it("awaits CAL before adding to storage", async () => {
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
            }),
          );
      }),
    );

    const executePromise = useCase.execute(
      successBroadcastStatus,
      signTransactionParams,
    );

    expect(mockStorageService.add).not.toHaveBeenCalled();
    expect(mockController.track).not.toHaveBeenCalled();

    calResolve();
    await executePromise;

    expect(mockStorageService.add).toHaveBeenCalledTimes(1);
    expect(mockStorageService.add).toHaveBeenCalledWith(
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
    expect(mockController.track).toHaveBeenCalledTimes(1);
  });

  it("should skip non-success statuses", async () => {
    const errorStatus: SignFlowStatus = {
      signType: "transaction",
      status: "error",
      error: new Error("failed"),
    };

    await useCase.execute(errorStatus, signTransactionParams);

    expect(mockStorageService.add).not.toHaveBeenCalled();
    expect(mockController.track).not.toHaveBeenCalled();
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

    expect(mockStorageService.add).not.toHaveBeenCalled();
  });

  it("should skip message signing results", async () => {
    const messageStatus: SignFlowStatus = {
      signType: "personal-sign",
      status: "success",
      data: { signature: "0xsig" },
    };

    await useCase.execute(messageStatus, ["0x1234", "hello", "personal_sign"]);

    expect(mockStorageService.add).not.toHaveBeenCalled();
  });

  it("should skip when no selected account", async () => {
    mockContextService.getContext.mockReturnValue({
      chainId: 1,
      selectedAccount: undefined,
    });

    await useCase.execute(successBroadcastStatus, signTransactionParams);

    expect(mockStorageService.add).not.toHaveBeenCalled();
  });

  it("should use fallback currency info when CalDataSource fails", async () => {
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Left(new Error("CAL unavailable")),
    );

    await useCase.execute(successBroadcastStatus, signTransactionParams);

    expect(mockStorageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        ticker: "ETHEREUM",
        currencyName: "ethereum",
        explorerUrl: undefined,
      }),
    );
    expect(mockController.track).toHaveBeenCalled();
  });

  it("should default value to '0' for raw transaction params", async () => {
    const rawParams: SignRawTransactionParams = {
      transaction: "0xdeadbeef",
      method: "eth_sendRawTransaction",
      broadcast: true,
    };

    await useCase.execute(successBroadcastStatus, rawParams);

    expect(mockStorageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "0",
      }),
    );
  });
});
