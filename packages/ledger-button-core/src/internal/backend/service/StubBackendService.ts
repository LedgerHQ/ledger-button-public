import { injectable } from "inversify";
import { Either, Right } from "purify-ts";

import {
  BroadcastRequest,
  BroadcastResponse,
  ConfigRequest,
  ConfigResponse,
} from "../model/types.js";
import { BackendService } from "./BackendService.js";

@injectable()
export class StubBackendService implements BackendService {
  async broadcast(
    request: BroadcastRequest,
    clientOrigin?: string,
    domain?: string,
  ): Promise {
    const response: BroadcastResponse = {
      result: "0x1b1ae4d6e2ef500000",
      id: request.rpc.id,
      jsonrpc: request.rpc.jsonrpc,
    };

    if (request.rpc.method === "eth_sendTransaction") {
      response.result =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      return Promise.resolve(Right(response));
    }
    if (request.rpc.method === "eth_getTransactionCount") {
      response.result = "0x1a";

      return Promise.resolve(Right(response));
    }

    if (request.rpc.method === "eth_gasPrice") {
      response.result = "0x3b9aca00";

      return Promise.resolve(Right(response));
    }

    if (request.rpc.method === "eth_estimateGas") {
      response.result = "0x5208";

      return Promise.resolve(Right(response));
    }

    return Promise.resolve(Right(response));
  }

  async getConfig(request: ConfigRequest, domain?: string): Promise {
    const response: ConfigResponse = {
      supportedBlockchains: [
        {
          blockchain: "ethereum",
          chain_ids: ["1", "4", "5", "11155111"],
        },
        {
          blockchain: "polygon",
          chain_ids: ["137", "80001"],
        },
        {
          blockchain: "bsc",
          chain_ids: ["56", "97"],
        },
      ],
      referralUrl: `https://shop.ledger.com?referral=${request.dAppIdentifier}-mock-uuid`,
      domainUrl: this.getDomainUrlForDapp(request.dAppIdentifier),
      appDependencies: [
        {
          blockchain: "ethereum",
          appName: this.getAppNameForDapp(request.dAppIdentifier),
          dependencies: this.getDependenciesForDapp(request.dAppIdentifier),
        },
      ],
    };

    return Promise.resolve(Right(response));
  }

  private getDomainUrlForDapp(dAppIdentifier: string): string {
    const domainMap: Record = {
      "1inch": "https://app.1inch.io",
      uniswap: "https://app.uniswap.org",
    };

    return domainMap[dAppIdentifier] || `https://${dAppIdentifier}.example.com`;
  }

  private getAppNameForDapp(dAppIdentifier: string): string {
    const nameMap: Record = {
      "1inch": "1Inch",
      uniswap: "Uniswap",
    };

    return (
      nameMap[dAppIdentifier] ||
      dAppIdentifier.charAt(0).toUpperCase() + dAppIdentifier.slice(1)
    );
  }

  private getDependenciesForDapp(dAppIdentifier: string): string[] {
    const dependenciesMap: Record = {
      "1inch": ["1Inch", "Ethereum"],
      uniswap: ["Uniswap V3", "Ethereum"],
    };

    return (
      dependenciesMap[dAppIdentifier] || [
        this.getAppNameForDapp(dAppIdentifier),
        "Ethereum",
      ]
    );
  }
}
