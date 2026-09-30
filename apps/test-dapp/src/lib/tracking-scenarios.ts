export interface EventRequest {
  name: string;
  type: string;
  data: Record<string, unknown>;
}

export type SimulatedFamily = "ethereum" | "solana";

/** `chain_id` the core sends for each family (EVM chain id, Solana cluster). */
export const SIMULATED_CHAIN_IDS: Record<SimulatedFamily, string> = {
  ethereum: "1",
  solana: "mainnet",
};

export interface ScenarioContext {
  dAppId: string;
  sessionId: string;
  family: SimulatedFamily;
  chainId: string;
}

export interface Scenario {
  name: string;
  description: string;
  /** Families the scenario applies to; all when omitted. */
  families?: SimulatedFamily[];
  buildEvents: (ctx: ScenarioContext) => EventRequest[];
}

function randomString(alphabet: string, length: number): string {
  return Array.from({ length }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
  ).join("");
}

function hexHash(length = 64): string {
  return randomString("0123456789abcdef", length);
}

/** EVM hashes are lowercase hex; Solana ids are base58 64-byte signatures. */
function transactionHash(ctx: ScenarioContext): string {
  return ctx.family === "solana"
    ? randomString(
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
        88,
      )
    : hexHash();
}

function baseData(ctx: ScenarioContext) {
  return {
    event_id: crypto.randomUUID(),
    transaction_dapp_id: ctx.dAppId,
    timestamp_ms: Date.now(),
  };
}

function sessionEvent(ctx: ScenarioContext, eventType: string) {
  return {
    name: eventType,
    type: eventType,
    data: {
      ...baseData(ctx),
      event_type: eventType,
      session_id: ctx.sessionId,
    },
  };
}

function chainEvent(
  ctx: ScenarioContext,
  eventType: string,
  extra?: Record<string, unknown>,
) {
  return {
    name: eventType,
    type: eventType,
    data: {
      ...baseData(ctx),
      event_type: eventType,
      session_id: ctx.sessionId,
      blockchain_network_selected: ctx.family,
      chain_id: ctx.chainId,
      ...extra,
    },
  };
}

const consentGiven = (ctx: ScenarioContext): EventRequest => ({
  name: "consent_given",
  type: "consent_given",
  data: { ...baseData(ctx), event_type: "consent_given" },
});

const openSession = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "open_session");

const openLedgerSync = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "open_ledger_sync");

const ledgerSyncActivated = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "ledger_sync_activated");

const onboarding = (ctx: ScenarioContext) =>
  chainEvent(ctx, "onboarding");

const floatingButtonClicked = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "floating_button_clicked");

const transactionFlowInitialization = (ctx: ScenarioContext) =>
  chainEvent(ctx, "transaction_flow_initialization");

const transactionFlowCompletion = (ctx: ScenarioContext) =>
  chainEvent(ctx, "transaction_flow_completion");

const viewTransactionDetailsClicked = (ctx: ScenarioContext) =>
  chainEvent(ctx, "view_transaction_details_clicked", {
    transaction_hash: transactionHash(ctx),
  });

const invoicingTransactionSigned = (ctx: ScenarioContext): EventRequest => ({
  name: "invoicing_transaction_signed",
  type: "invoicing_transaction_signed",
  data: {
    ...baseData(ctx),
    event_type: "invoicing_transaction_signed",
    blockchain_network_selected: ctx.family,
    chain_id: ctx.chainId,
    transaction_hash: transactionHash(ctx),
    // Solana transactions have no single recipient yet.
    recipient_address: ctx.family === "solana" ? "" : hexHash(40),
    unsigned_transaction_hash: hexHash(),
  },
});

const typedMessageFlowInitialization = (ctx: ScenarioContext) =>
  chainEvent(ctx, "typed_message_flow_initialization", {
    typed_message_hash: hexHash(),
  });

const typedMessageFlowCompletion = (ctx: ScenarioContext) =>
  chainEvent(ctx, "typed_message_flow_completion", {
    typed_message_hash: hexHash(),
  });

const walletActionClicked = (ctx: ScenarioContext): EventRequest => ({
  name: "wallet_action_clicked",
  type: "wallet_action_clicked",
  data: {
    ...baseData(ctx),
    event_type: "wallet_action_clicked",
    session_id: ctx.sessionId,
    wallet_action: "swap",
  },
});

const walletRedirectConfirmed = (ctx: ScenarioContext): EventRequest => ({
  name: "wallet_redirect_confirmed",
  type: "wallet_redirect_confirmed",
  data: {
    ...baseData(ctx),
    event_type: "wallet_redirect_confirmed",
    session_id: ctx.sessionId,
    wallet_action: "swap",
  },
});

const walletRedirectCancelled = (ctx: ScenarioContext): EventRequest => ({
  name: "wallet_redirect_cancelled",
  type: "wallet_redirect_cancelled",
  data: {
    ...baseData(ctx),
    event_type: "wallet_redirect_cancelled",
    session_id: ctx.sessionId,
    wallet_action: "swap",
  },
});

const errorOccurred = (ctx: ScenarioContext): EventRequest => ({
  name: "error_occurred",
  type: "error_occurred",
  data: {
    ...baseData(ctx),
    event_type: "error_occurred",
    session_id: ctx.sessionId,
    error_type: "SimulatedError",
    error_code: "SIMULATED_ERROR",
    error_message: "This is a simulated error event",
    error_category: "simulation",
  },
});

const mobileRedirectLedgerWallet = (ctx: ScenarioContext): EventRequest => ({
  name: "mobile_redirect_ledger_wallet",
  type: "mobile_redirect_ledger_wallet",
  data: { ...baseData(ctx), event_type: "mobile_redirect_ledger_wallet" },
});

const languageChanged = (ctx: ScenarioContext): EventRequest => ({
  name: "language_changed",
  type: "language_changed",
  data: {
    ...baseData(ctx),
    event_type: "language_changed",
    session_id: ctx.sessionId,
    language_key: "en",
  },
});

const currencyChanged = (ctx: ScenarioContext): EventRequest => ({
  name: "currency_changed",
  type: "currency_changed",
  data: {
    ...baseData(ctx),
    event_type: "currency_changed",
    session_id: ctx.sessionId,
    currency_code: "eur",
  },
});

export const SCENARIOS: Scenario[] = [
  {
    name: "onboarding",
    description: "Consent > session > ledger sync > onboarding",
    buildEvents: (ctx) => [
      consentGiven(ctx),
      openSession(ctx),
      openLedgerSync(ctx),
      ledgerSyncActivated(ctx),
      onboarding(ctx),
    ],
  },
  {
    name: "transaction",
    description: "Button click > tx init > auth > tx completion",
    buildEvents: (ctx) => [
      floatingButtonClicked(ctx),
      transactionFlowInitialization(ctx),
      transactionFlowCompletion(ctx),
      viewTransactionDetailsClicked(ctx),
    ],
  },
  {
    name: "message-signing",
    description: "Typed message init > completion",
    families: ["ethereum"],
    buildEvents: (ctx) => [
      typedMessageFlowInitialization(ctx),
      typedMessageFlowCompletion(ctx),
    ],
  },
  {
    name: "invoicing",
    description: "Invoicing transaction signed",
    buildEvents: (ctx) => [invoicingTransactionSigned(ctx)],
  },
  {
    name: "wallet-action",
    description: "Wallet action click > redirect confirmed",
    buildEvents: (ctx) => [
      walletActionClicked(ctx),
      walletRedirectConfirmed(ctx),
    ],
  },
  {
    name: "wallet-action-cancelled",
    description: "Wallet action click > redirect cancelled",
    buildEvents: (ctx) => [
      walletActionClicked(ctx),
      walletRedirectCancelled(ctx),
    ],
  },
  {
    name: "mobile-redirect",
    description: "Mobile redirect to Ledger Wallet app",
    buildEvents: (ctx) => [mobileRedirectLedgerWallet(ctx)],
  },
  {
    name: "preferences",
    description: "Language and fiat currency preference changes",
    buildEvents: (ctx) => [languageChanged(ctx), currencyChanged(ctx)],
  },
  {
    name: "error",
    description: "Simulated error event",
    buildEvents: (ctx) => [errorOccurred(ctx)],
  },
  {
    name: "full-session",
    description: "Full flow: onboarding > tx > message > wallet",
    buildEvents: (ctx) => [
      consentGiven(ctx),
      openSession(ctx),
      openLedgerSync(ctx),
      ledgerSyncActivated(ctx),
      onboarding(ctx),
      floatingButtonClicked(ctx),
      transactionFlowInitialization(ctx),
      transactionFlowCompletion(ctx),
      viewTransactionDetailsClicked(ctx),
      invoicingTransactionSigned(ctx),
      ...(ctx.family === "ethereum"
        ? [typedMessageFlowInitialization(ctx), typedMessageFlowCompletion(ctx)]
        : []),
      walletActionClicked(ctx),
      walletRedirectConfirmed(ctx),
      mobileRedirectLedgerWallet(ctx),
    ],
  },
];

export function getScenariosForFamily(family: SimulatedFamily): Scenario[] {
  return SCENARIOS.filter(
    (scenario) => !scenario.families || scenario.families.includes(family),
  );
}
