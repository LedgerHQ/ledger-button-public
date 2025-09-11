import { Left, Right } from "purify-ts";

import type { NetworkService } from "../network/NetworkService.js";
import { DefaultBackendService } from "./DefaultBackendService.js";
import type {
  BroadcastRequest,
  EventRequest,
  EventResponse,
} from "./types.js";

describe("DefaultBackendService", () => {
  let backendService: DefaultBackendService;
  let mockNetworkService: NetworkService<{ headers?: Record<string, string> }>;

  beforeEach(() => {
    mockNetworkService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    backendService = new DefaultBackendService(mockNetworkService);
    vi.clearAllMocks();
  });

  describe("event", () => {
    const mockEventRequest: EventRequest = {
      name: "test-event",
      type: "OpenSession",
      data: {
        event_id: "test-event-id",
        event_type: "OpenSession",
        transaction_dapp_id: "test-dapp",
        timestamp_ms: Date.now(),
        session_id: "test-session-id",
      },
    };

    const mockSuccessResponse: EventResponse = {
      success: true,
    };

    const mockErrorResponse: EventResponse = {
      error: "Validation failed",
      code: 400,
    };

    it("should send event request with correct headers and URL", async () => {
      mockNetworkService.post.mockResolvedValueOnce(Right(mockSuccessResponse));

      await backendService.event(mockEventRequest, "test-domain");

      expect(mockNetworkService.post).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/event",
        JSON.stringify(mockEventRequest),
        {
          headers: {
            "Content-Type": "application/json",
            "X-Ledger-Domain": "test-domain",
          },
        },
      );
    });

    it("should use default domain when not provided", async () => {
      mockNetworkService.post.mockResolvedValueOnce(Right(mockSuccessResponse));

      await backendService.event(mockEventRequest);

      expect(mockNetworkService.post).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/event",
        JSON.stringify(mockEventRequest),
        {
          headers: {
            "Content-Type": "application/json",
            "X-Ledger-Domain": "ledger-button-domain",
          },
        },
      );
    });

    it("should return success response when event is tracked successfully", async () => {
      mockNetworkService.post.mockResolvedValueOnce(Right(mockSuccessResponse));

      const result = await backendService.event(mockEventRequest);

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual(mockSuccessResponse);
    });

    it("should return error response when event tracking fails", async () => {
      mockNetworkService.post.mockResolvedValueOnce(Right(mockErrorResponse));

      const result = await backendService.event(mockEventRequest);

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual(mockErrorResponse);
    });

    it("should handle network errors and wrap them appropriately", async () => {
      const networkError = new Error("Network connection failed");
      mockNetworkService.post.mockResolvedValueOnce(Left(networkError));

      const result = await backendService.event(mockEventRequest);

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toEqual(
        new Error("Event tracking failed: Network connection failed"),
      );
    });

    it("should handle different event types", async () => {
      const consentEventRequest: EventRequest = {
        name: "consent-given",
        type: "ConsentGiven",
        data: {
          event_id: "consent-event-id",
          event_type: "ConsentGiven",
          transaction_dapp_id: "test-dapp",
          timestamp_ms: Date.now(),
          ledger_sync_user_id: "user-123",
        },
      };

      mockNetworkService.post.mockResolvedValueOnce(Right(mockSuccessResponse));

      const result = await backendService.event(consentEventRequest);

      expect(result.isRight()).toBe(true);
      expect(mockNetworkService.post).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/event",
        JSON.stringify(consentEventRequest),
        expect.any(Object),
      );
    });

    it("should handle transaction flow events with additional fields", async () => {
      const transactionEventRequest: EventRequest = {
        name: "transaction-flow-completion",
        type: "TransactionFlowCompletion",
        data: {
          event_id: "transaction-event-id",
          event_type: "TransactionFlowCompletion",
          transaction_dapp_id: "test-dapp",
          timestamp_ms: Date.now(),
          session_id: "session-123",
          ledger_sync_user_id: "user-123",
          blockchain_network_selected: "ethereum",
          account_currency: "ETH",
          account_balance: "1.5",
          transaction_hash: "0x123abc",
          transaction_type: "transfer",
        },
      };

      mockNetworkService.post.mockResolvedValueOnce(Right(mockSuccessResponse));

      const result = await backendService.event(transactionEventRequest);

      expect(result.isRight()).toBe(true);
      expect(mockNetworkService.post).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/event",
        JSON.stringify(transactionEventRequest),
        expect.any(Object),
      );
    });
  });

  describe("broadcast", () => {
    const mockBroadcastRequest: BroadcastRequest = {
      blockchain: {
        name: "ethereum",
        chain_id: "1",
      },
      rpc: {
        method: "eth_sendTransaction",
        params: [],
        id: 1,
        jsonrpc: "2.0",
      },
    };

    it("should send broadcast request with correct headers", async () => {
      const mockResponse = {
        result: "0x123abc",
        id: 1,
        jsonrpc: "2.0",
      };

      mockNetworkService.post.mockResolvedValueOnce(Right(mockResponse));

      await backendService.broadcast(
        mockBroadcastRequest,
        "test-origin",
        "test-domain",
      );

      expect(mockNetworkService.post).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/broadcast",
        JSON.stringify(mockBroadcastRequest),
        {
          headers: {
            "Content-Type": "application/json",
            "X-Ledger-client-origin": "test-origin",
            "X-Ledger-Domain": "test-domain",
          },
        },
      );
    });
  });

  describe("getConfig", () => {
    it("should send config request with correct parameters", async () => {
      const mockConfigResponse = {
        supportedBlockchains: [],
        referralUrl: "https://example.com",
        domainUrl: "https://example.com",
        appDependencies: [],
      };

      mockNetworkService.get.mockResolvedValueOnce(Right(mockConfigResponse));

      await backendService.getConfig(
        { dAppIdentifier: "test-dapp" },
        "test-domain",
      );

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        "https://ledgerb.aws.stg.ldg-tech.com/config?dAppIdentifier=test-dapp",
        {
          headers: {
            "X-Ledger-Domain": "test-domain",
          },
        },
      );
    });
  });
});