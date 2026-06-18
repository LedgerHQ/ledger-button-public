import { describe, expect, it } from "vitest";

import { SolanaRemoteDatasource } from "./ledger-solana-wallet/rpc/datasource/SolanaRemoteDatasource.js";
import { StubSolanaRemoteDatasource } from "./ledger-solana-wallet/rpc/datasource/StubSolanaRemoteDatasource.js";
import { createContainer } from "../di.js";
import { solanaProviderModuleTypes } from "./solanaProviderModuleTypes.js";

describe("solanaProviderModule", () => {
  it("should resolve SolanaRemoteDatasource from the root container", () => {
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

    const datasource = container.get<SolanaRemoteDatasource>(
      solanaProviderModuleTypes.SolanaRemoteDatasource,
    );

    const response = await datasource.JSONRPCRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [],
    });

    expect(response.isRight()).toBe(true);
    expect(response.extract()).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32601,
        message: expect.stringContaining("getBalance"),
      },
    });
  });
});
