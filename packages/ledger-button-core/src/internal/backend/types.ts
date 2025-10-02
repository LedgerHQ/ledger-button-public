import { infer as ZodInfer, ZodError } from "zod";

import type { JSONRPCRequest } from "../../api/model/eip/EIPTypes.js";
import { ConfigResponseSchema } from "./schemas.js";

export type Blockchain = {
  name: string;
  chainId: string;
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

export enum EventType {
  ConsentGiven = "consent_given",
  ConsentRemoved = "consent_removed",
  InvoicingTransactionSigned = "invoicing_transaction_signed",
  LedgerSyncActivated = "ledger_sync_activated",
  Onboarding = "onboarding",
  OpenLedgerSync = "open_ledger_sync",
  OpenSession = "open_session",
  SessionAuthentication = "session_authentication",
  TransactionFlowCompletion = "transaction_flow_completion",
  TransactionFlowInitialization = "transaction_flow_initialization",
}

type BaseEventData = {
  event_id: string;
  transaction_dapp_id: string;
  timestamp_ms: number;
};

export type InvoicingTransactionSignedEventData = BaseEventData & {
  event_type: "invoicing_transaction_signed";
  ledger_sync_user_id: string;
  blockchain_network_selected: "ethereum";
  transaction_type: "ETH_transfer" | "ERC-20_approve";
  transaction_hash: string;
  source_token: string;
  target_token: string;
  recipient_address: string;
  transaction_amount: string;
  transaction_id: string;
};

export type ConsentGivenEventData = BaseEventData & {
  event_type: "consent_given";
  ledger_sync_user_id: string;
};

export type ConsentRemovedEventData = BaseEventData & {
  event_type: "consent_removed";
  ledger_sync_user_id: string;
};

export type OpenSessionEventData = BaseEventData & {
  event_type: "open_session";
  session_id: string;
};

export type OpenLedgerSyncEventData = BaseEventData & {
  event_type: "open_ledger_sync";
  session_id: string;
};

export type LedgerSyncActivatedEventData = BaseEventData & {
  event_type: "ledger_sync_activated";
  session_id: string;
  ledger_sync_user_id: string;
};

export type OnboardingEventData = BaseEventData & {
  event_type: "onboarding";
  session_id: string;
  ledger_sync_user_id: string;
  blockchain_network_selected: "ethereum";
  account_currency: string;
  account_balance: string;
};

export type TransactionFlowInitializationEventData = BaseEventData & {
  event_type: "transaction_flow_initialization";
  session_id: string;
  ledger_sync_user_id: string;
  blockchain_network_selected: "ethereum";
  account_currency: string;
  account_balance: string;
  unsigned_transaction_hash: string;
  transaction_type: "authentication_tx" | "standard_tx";
};

export type TransactionFlowCompletionEventData = BaseEventData & {
  event_type: "transaction_flow_completion";
  session_id: string;
  ledger_sync_user_id: string;
  blockchain_network_selected: "ethereum";
  account_currency: string;
  account_balance: string;
  unsigned_transaction_hash: string;
  transaction_type: "authentication_tx" | "standard_tx";
  transaction_hash: string;
};

export type SessionAuthenticationEventData = BaseEventData & {
  event_type: "session_authentication";
  session_id: string;
  ledger_sync_user_id: string;
  blockchain_network_selected: "ethereum";
  unsigned_transaction_hash: string;
  transaction_type: "authentication_tx";
  transaction_hash: string;
};

export type EventData =
  | InvoicingTransactionSignedEventData
  | ConsentGivenEventData
  | ConsentRemovedEventData
  | OpenSessionEventData
  | OpenLedgerSyncEventData
  | LedgerSyncActivatedEventData
  | OnboardingEventData
  | TransactionFlowInitializationEventData
  | TransactionFlowCompletionEventData
  | SessionAuthenticationEventData;

export type EventRequest = {
  name: string;
  type: EventType;
  data: EventData;
};

export type EventResponseSuccess = {
  EventResponseSuccess: {
    success: true;
  };
};

export type EventResponseError = {
  time: null;
  message: string;
  status: number;
  type: string;
};

export type EventResponse = EventResponseSuccess | EventResponseError;
