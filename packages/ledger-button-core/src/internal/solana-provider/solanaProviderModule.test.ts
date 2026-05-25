import { describe, expect, it } from "vitest";

import { SolanaRemoteDatasource } from "./rpc/datasource/SolanaRemoteDatasource.js";
import { StubSolanaRemoteDatasource } from "./rpc/datasource/StubSolanaRemoteDatasource.js";
import { SolanaRPCCallUseCase } from "./rpc/use-case/SolanaRPCRequest.js";
import { SendSolanaTransactionUseCase } from "./use-case/SendSolanaTransactionUseCase.js";
import { SignSolanaMessageUseCase } from "./use-case/SignSolanaMessageUseCase.js";
import { SignSolanaTransactionUseCase } from "./use-case/SignSolanaTransactionUseCase.js";
import { createContainer } from "../di.js";
import { solanaProviderModuleTypes } from "./solanaProviderModuleTypes.js";

describe("solanaProviderModule", () => {
  it("should resolve all Solana provider bindings from the root container", () => {
    const container = createContainer({
      devConfig: {
        stub: {
          solanaProvider: false,
        },
      },
    });

    expect(
      container.get<SolanaRemoteDatasource>(
        solanaProviderModuleTypes.SolanaRemoteDatasource,
      ),
    ).toBeInstanceOf(SolanaRemoteDatasource);
    expect(
      container.get<SolanaRPCCallUseCase>(
        solanaProviderModuleTypes.SolanaRPCCallUseCase,
      ),
    ).toBeInstanceOf(SolanaRPCCallUseCase);
    expect(
      container.get<SignSolanaMessageUseCase>(
        solanaProviderModuleTypes.SignSolanaMessageUseCase,
      ),
    ).toBeInstanceOf(SignSolanaMessageUseCase);
    expect(
      container.get<SignSolanaTransactionUseCase>(
        solanaProviderModuleTypes.SignSolanaTransactionUseCase,
      ),
    ).toBeInstanceOf(SignSolanaTransactionUseCase);
    expect(
      container.get<SendSolanaTransactionUseCase>(
        solanaProviderModuleTypes.SendSolanaTransactionUseCase,
      ),
    ).toBeInstanceOf(SendSolanaTransactionUseCase);
  });

  it("should bind StubSolanaRemoteDatasource when solanaProvider stub is enabled", () => {
    const container = createContainer({
      devConfig: {
        stub: {
          solanaProvider: true,
        },
      },
    });

    expect(
      container.get<SolanaRemoteDatasource>(
        solanaProviderModuleTypes.SolanaRemoteDatasource,
      ),
    ).toBeInstanceOf(StubSolanaRemoteDatasource);
  });

  it("should return unsupported method error from stub datasource", async () => {
    const container = createContainer({
      devConfig: {
        stub: {
          solanaProvider: true,
        },
      },
    });

    const useCase = container.get<SolanaRPCCallUseCase>(
      solanaProviderModuleTypes.SolanaRPCCallUseCase,
    );

    const response = await useCase.execute({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [],
    });

    expect(response).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32601,
        message: expect.stringContaining("getBalance"),
      },
    });
  });
});
