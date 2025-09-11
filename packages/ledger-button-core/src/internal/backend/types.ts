import { infer as ZodInfer, ZodError } from "zod";

import type { JSONRPCRequest } from "../web3-provider/model/EIPTypes.js";
import { ConfigResponseSchema } from "./schemas.js";

export type Blockchain = {
  name: string;
  chain_id: string;
};

export type BroadcastRequest = {
  blockchain: Blockchain;
  rpc: JSONRPCRequest;
};

export type BroadcastResponse = {
  result?: string;
  error?: {
    code: number;
    message: string;
  };
  id: number;
  jsonrpc: string;
};

export type ConfigRequest = {
  dAppIdentifier: string;
};

export type ConfigResponse = ZodInfer<typeof ConfigResponseSchema>;

export type BackendServiceError = Error;

export type ConfigResponseError = Error | ZodError;

export type EventType = 
  | "ConsentGiven"
  | "ConsentRemoved"
  | "InvoicingTransactionSigned"
  | "LedgerSyncActivated"
  | "Onboarding"
  | "OpenLedgerSync"
  | "OpenSession"
  | "SessionAuthentication"
  | "TransactionFlowCompletion"
  | "TransactionFlowInitialization";

export type EventData = {
  event_id: string;
  event_type: EventType;
  transaction_dapp_id: string;
  timestamp_ms: number;
  session_id?: string;
  ledger_sync_user_id?: string;
  blockchain_network_selected?: string;
  account_currency?: string;
  account_balance?: string;
  transaction_hash?: string;
  transaction_type?: string;
  source_token?: string;
  transaction_amount?: string;
  target_token?: string;
  recipient_address?: string;
  transaction_id?: string;
};

export type EventRequest = {
  name: string;
  type: EventType;
  data: EventData;
};

export type EventResponse = {
  success: boolean;
} | {
  error: string;
  code: number;
};

export type EventResponseError = Error;
