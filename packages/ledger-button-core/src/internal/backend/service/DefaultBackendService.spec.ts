import { Container } from "inversify";
import { Left, Right } from "purify-ts";

import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import {
  BroadcastRequest,
  BroadcastResponse,
  ConfigRequest,
  ConfigResponse,
} from "../model/types.js";
import { DefaultBackendService } from "./DefaultBackendService.js";

describe("DefaultBackendService", () => {
  let service: DefaultBackendService;
  let mockNetworkService: jest.Mocked;
  let container: Container;

  beforeEach(() => {
    mockNetworkService = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    container = new Container();
    container
      .bind(networkModuleTypes.NetworkService)
      .toConstantValue(mockNetworkService);

    service = new DefaultBackendService(mockNetworkService);
  });

  describe("broadcast", () => {
    const mockRequest: BroadcastRequest = {
      blockchain: {
        name: "ethereum",
        chain_id: "1",
      },
      rpc: {
        method: "eth_getBalance",
        params: ["0x8D97689C9818892B700e27F316cc3E41e17fBeb9", "latest"],
        id: 1,
        jsonrpc: "2.0",
      },
    };

    const mockResponse: BroadcastResponse = {
      result: "0x1b1ae4d6e2ef500000",
      id: 1,
      jsonrpc: "2.0",
    };

    it("should successfully broadcast a request", async () => {
      mockNetworkService.post.mockResolvedValue(Right(mockResponse));

      const result = await service.broadcast(
        mockRequest,
        "test-origin",
        "test-domain",
      );

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual(mockResponse);

      expect(mockNetworkService.post).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/broadcast",
        mockRequest,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Ledger-client-origin": "test-origin",
            "X-Ledger-domain": "test-domain",
          },
        },
      );
    });

    it("should use default headers when not provided", async () => {
      mockNetworkService.post.mockResolvedValue(Right(mockResponse));

      await service.broadcast(mockRequest);

      expect(mockNetworkService.post).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/broadcast",
        mockRequest,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Ledger-client-origin": "ledger-button",
            "X-Ledger-domain": "ledger-button-domain",
          },
        },
      );
    });

    it("should handle network service errors", async () => {
      const networkError = new Error("Network request failed");
      mockNetworkService.post.mockResolvedValue(Left(networkError));

      const result = await service.broadcast(mockRequest);

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toEqual(
        new Error("Broadcast failed: Network request failed"),
      );
    });

    it("should handle thrown exceptions", async () => {
      const error = new Error("Unexpected error");
      mockNetworkService.post.mockRejectedValue(error);

      const result = await service.broadcast(mockRequest);

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toEqual(
        new Error("Broadcast request failed: Unexpected error"),
      );
    });
  });

  describe("getConfig", () => {
    const mockRequest: ConfigRequest = {
      dAppIdentifier: "1inch",
    };

    const mockResponse: ConfigResponse = {
      supportedBlockchains: [
        {
          blockchain: "ethereum",
          chain_ids: ["1", "4"],
        },
      ],
      referralUrl: "https://shop.ledger.com?referral=uuid-of-the-dapp",
      domainUrl: "https://app.1inch.io",
      appDependencies: [
        {
          blockchain: "ethereum",
          appName: "1Inch",
          dependencies: ["1Inch", "Ethereum"],
        },
      ],
    };

    it("should successfully get config", async () => {
      mockNetworkService.get.mockResolvedValue(Right(mockResponse));

      const result = await service.getConfig(mockRequest, "test-domain");

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual(mockResponse);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/config?dAppIdentifier=1inch",
        {
          headers: {
            "X-Ledger-Domain": "test-domain",
          },
        },
      );
    });

    it("should use default domain when not provided", async () => {
      mockNetworkService.get.mockResolvedValue(Right(mockResponse));

      await service.getConfig(mockRequest);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/config?dAppIdentifier=1inch",
        {
          headers: {
            "X-Ledger-Domain": "ledger-button-domain",
          },
        },
      );
    });

    it("should properly encode dApp identifier in URL", async () => {
      const requestWithSpecialChars: ConfigRequest = {
        dAppIdentifier: "test app & more",
      };

      mockNetworkService.get.mockResolvedValue(Right(mockResponse));

      await service.getConfig(requestWithSpecialChars);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/config?dAppIdentifier=test%20app%20%26%20more",
        expect.any(Object),
      );
    });

    it("should handle network service errors", async () => {
      const networkError = new Error("Network request failed");
      mockNetworkService.get.mockResolvedValue(Left(networkError));

      const result = await service.getConfig(mockRequest);

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toEqual(
        new Error("Get config failed: Network request failed"),
      );
    });

    it("should handle thrown exceptions", async () => {
      const error = new Error("Unexpected error");
      mockNetworkService.get.mockRejectedValue(error);

      const result = await service.getConfig(mockRequest);

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toEqual(
        new Error("Get config request failed: Unexpected error"),
      );
    });
  });
});
