import { z } from "zod";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const hexPattern = /^[0-9a-f]+$/;

const BaseEventDataSchema = z.object({
  event_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  transaction_dapp_id: z.string(),
  timestamp_ms: z.number().int().nonnegative(),
});

/**
 * Matches: ./sre-bento/containers/ledger-button-invoicing-events/config/schema.json
 */
export const InvoicingTransactionSignedEventSchema = BaseEventDataSchema.extend(
  {
    event_type: z.literal("invoicing_transaction_signed"),
    ledger_sync_user_id: z.string().optional(),
    blockchain_network_selected: z.enum(["ethereum"]),
    chain_id: z.string().nullable(),
    transaction_hash: z
      .string()
      .regex(
        hexPattern,
        "Transaction hash must be lowercase hex without 0x prefix",
      ),
    recipient_address: z.string(),
    unsigned_transaction_hash: z
      .string()
      .regex(hexPattern, "Sha256 hash without 0x prefix"),
  },
).strict();

/**
 * Matches: ./sre-bento/containers/ledger-button-product-analytics-events/config/schema.json
 */
export const ConsentGivenEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("consent_given"),
}).strict();

export const ConsentRemovedEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("consent_removed"),
  ledger_sync_user_id: z.string().optional(),
}).strict();

export const FloatingButtonClickEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("floating_button_clicked"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
}).strict();

export const OpenSessionEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("open_session"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
}).strict();

export const OpenLedgerSyncEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("open_ledger_sync"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
}).strict();

export const LedgerSyncActivatedEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("ledger_sync_activated"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  ledger_sync_user_id: z.string().optional(),
}).strict();

export const OnboardingEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("onboarding"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  ledger_sync_user_id: z.string().optional(),
  blockchain_network_selected: z.enum(["ethereum"]),
  chain_id: z.string().nullable(),
}).strict();

export const TransactionFlowInitializationEventSchema =
  BaseEventDataSchema.extend({
    event_type: z.literal("transaction_flow_initialization"),
    session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
    ledger_sync_user_id: z.string().optional(),
    blockchain_network_selected: z.enum(["ethereum"]),
    chain_id: z.string().nullable(),
  }).strict();

export const TransactionFlowCompletionEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("transaction_flow_completion"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  ledger_sync_user_id: z.string().optional(),
  blockchain_network_selected: z.enum(["ethereum"]),
  chain_id: z.string().nullable(),
}).strict();

export const TypedMessageFlowInitializationEventSchema =
  BaseEventDataSchema.extend({
    event_type: z.literal("typed_message_flow_initialization"),
    session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
    ledger_sync_user_id: z.string().optional(),
    blockchain_network_selected: z.enum(["ethereum"]),
    chain_id: z.string().nullable(),
    typed_message_hash: z
      .string()
      .regex(hexPattern, "Sha256 hash without 0x prefix"),
  }).strict();

export const TypedMessageFlowCompletionEventSchema = BaseEventDataSchema.extend(
  {
    event_type: z.literal("typed_message_flow_completion"),
    session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
    ledger_sync_user_id: z.string().optional(),
    blockchain_network_selected: z.enum(["ethereum"]),
    chain_id: z.string().nullable(),
    typed_message_hash: z
      .string()
      .regex(hexPattern, "Sha256 hash without 0x prefix"),
  },
).strict();

const walletActionSchema = z.enum([
  "send",
  "receive",
  "swap",
  "buy",
  "earn",
  "sell",
]);

export const WalletActionClickedEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("wallet_action_clicked"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  wallet_action: walletActionSchema,
}).strict();

export const WalletRedirectConfirmedEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("wallet_redirect_confirmed"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  wallet_action: walletActionSchema,
}).strict();

export const WalletRedirectCancelledEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("wallet_redirect_cancelled"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  wallet_action: walletActionSchema,
}).strict();

export const MobileRedirectLedgerWalletEventSchema = BaseEventDataSchema.extend(
  {
    event_type: z.literal("mobile_redirect_ledger_wallet"),
  },
).strict();

export const ViewTransactionDetailsClickedEventSchema =
  BaseEventDataSchema.extend({
    event_type: z.literal("view_transaction_details_clicked"),
    session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
    ledger_sync_user_id: z.string().optional(),
    blockchain_network_selected: z.enum(["ethereum"]),
    chain_id: z.string().nullable(),
    transaction_hash: z
      .string()
      .regex(
        hexPattern,
        "Transaction hash must be lowercase hex without 0x prefix",
      ),
  }).strict();

export const ViewAllTransactionsClickedEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("view_all_transactions_clicked"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  ledger_sync_user_id: z.string().optional(),
  currency_id: z.string().min(1),
  account_address: z.string().min(1),
}).strict();

export const ViewAllTransactionsRedirectConfirmedEventSchema =
  BaseEventDataSchema.extend({
    event_type: z.literal("view_all_transactions_redirect_confirmed"),
    session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
    ledger_sync_user_id: z.string().optional(),
    currency_id: z.string().min(1),
    account_address: z.string().min(1),
  }).strict();

export const ViewAllTransactionsRedirectCancelledEventSchema =
  BaseEventDataSchema.extend({
    event_type: z.literal("view_all_transactions_redirect_cancelled"),
    session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
    ledger_sync_user_id: z.string().optional(),
    currency_id: z.string().min(1),
    account_address: z.string().min(1),
  }).strict();

export const LanguageChangedEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("language_changed"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  language_key: z.string().min(1),
}).strict();

export const CurrencyChangedEventSchema = BaseEventDataSchema.extend({
  event_type: z.literal("currency_changed"),
  session_id: z.string().regex(uuidPattern, "Invalid UUID format"),
  currency_code: z.string().min(1),
}).strict();

export const EventDataSchema = z.discriminatedUnion("event_type", [
  InvoicingTransactionSignedEventSchema,
  ConsentGivenEventSchema,
  ConsentRemovedEventSchema,
  FloatingButtonClickEventSchema,
  OpenSessionEventSchema,
  OpenLedgerSyncEventSchema,
  LedgerSyncActivatedEventSchema,
  OnboardingEventSchema,
  TransactionFlowInitializationEventSchema,
  TransactionFlowCompletionEventSchema,
  TypedMessageFlowInitializationEventSchema,
  TypedMessageFlowCompletionEventSchema,
  WalletActionClickedEventSchema,
  WalletRedirectConfirmedEventSchema,
  WalletRedirectCancelledEventSchema,
  MobileRedirectLedgerWalletEventSchema,
  ViewTransactionDetailsClickedEventSchema,
  ViewAllTransactionsClickedEventSchema,
  ViewAllTransactionsRedirectConfirmedEventSchema,
  ViewAllTransactionsRedirectCancelledEventSchema,
  LanguageChangedEventSchema,
  CurrencyChangedEventSchema,
]);

export type InvoicingTransactionSignedEvent = z.infer<
  typeof InvoicingTransactionSignedEventSchema
>;
export type ConsentGivenEvent = z.infer<typeof ConsentGivenEventSchema>;
export type ConsentRemovedEvent = z.infer<typeof ConsentRemovedEventSchema>;
export type OpenSessionEvent = z.infer<typeof OpenSessionEventSchema>;
export type OpenLedgerSyncEvent = z.infer<typeof OpenLedgerSyncEventSchema>;
export type LedgerSyncActivatedEvent = z.infer<
  typeof LedgerSyncActivatedEventSchema
>;
export type OnboardingEvent = z.infer<typeof OnboardingEventSchema>;
export type TransactionFlowInitializationEvent = z.infer<
  typeof TransactionFlowInitializationEventSchema
>;
export type TransactionFlowCompletionEvent = z.infer<
  typeof TransactionFlowCompletionEventSchema
>;
export type TypedMessageFlowInitializationEvent = z.infer<
  typeof TypedMessageFlowInitializationEventSchema
>;
export type TypedMessageFlowCompletionEvent = z.infer<
  typeof TypedMessageFlowCompletionEventSchema
>;
export type WalletActionClickedEvent = z.infer<
  typeof WalletActionClickedEventSchema
>;
export type WalletRedirectConfirmedEvent = z.infer<
  typeof WalletRedirectConfirmedEventSchema
>;
export type WalletRedirectCancelledEvent = z.infer<
  typeof WalletRedirectCancelledEventSchema
>;
export type ViewTransactionDetailsClickedEvent = z.infer<
  typeof ViewTransactionDetailsClickedEventSchema
>;
export type ViewAllTransactionsClickedEvent = z.infer<
  typeof ViewAllTransactionsClickedEventSchema
>;
export type ViewAllTransactionsRedirectConfirmedEvent = z.infer<
  typeof ViewAllTransactionsRedirectConfirmedEventSchema
>;
export type ViewAllTransactionsRedirectCancelledEvent = z.infer<
  typeof ViewAllTransactionsRedirectCancelledEventSchema
>;
export type LanguageChangedEvent = z.infer<typeof LanguageChangedEventSchema>;
export type CurrencyChangedEvent = z.infer<typeof CurrencyChangedEventSchema>;
export type EventData = z.infer<typeof EventDataSchema>;
