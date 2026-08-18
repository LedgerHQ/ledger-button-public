"use client";

// Side-effect: SignedResultRegistry augmentations for EVM + Solana
import "@ledgerhq/ledger-wallet-provider-evm";
import "@ledgerhq/ledger-wallet-provider-solana";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { EIP6963ProviderDetail } from "@ledgerhq/ledger-wallet-provider";
import { createEvmBlockchainProvider } from "@ledgerhq/ledger-wallet-provider-evm";
import { createSolanaBlockchainProvider } from "@ledgerhq/ledger-wallet-provider-solana";

let LedgerButtonModule:
  | typeof import("@ledgerhq/ledger-wallet-provider")
  | null = null;

export type WalletTransactionFeature =
  | "send"
  | "receive"
  | "swap"
  | "buy"
  | "earn"
  | "sell";

export const ALL_WALLET_FEATURES: WalletTransactionFeature[] = [
  "send",
  "receive",
  "swap",
  "buy",
  "earn",
  "sell",
];

export type TransactionConfirmationNotification = "tooltip" | "toast";

export interface LedgerProviderConfig {
  dAppIdentifier: string;
  apiKey: string;
  buttonPosition: string;
  hideButton: boolean;
  logLevel: string;
  environment: string;
  walletTransactionFeatures: WalletTransactionFeature[];
  transactionConfirmationNotification: TransactionConfirmationNotification;
}

export const DEFAULT_CONFIG: LedgerProviderConfig = {
  dAppIdentifier: "ledger",
  apiKey: "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
  buttonPosition: "bottom-right",
  hideButton: false,
  logLevel: "info",
  environment: "production",
  walletTransactionFeatures: ["send", "receive", "swap", "buy", "earn", "sell"],
  transactionConfirmationNotification: "tooltip",
};

export interface LedgerContextValue {
  providers: EIP6963ProviderDetail[];
  selectedProvider: EIP6963ProviderDetail | null;
  setSelectedProvider: (provider: EIP6963ProviderDetail | null) => void;
  isInitialized: boolean;
  reinitialize: (newConfig?: LedgerProviderConfig) => void;
  config: LedgerProviderConfig;
  setConfig: (config: LedgerProviderConfig) => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

interface LedgerProviderProps {
  children: ReactNode;
}

export function LedgerProvider({ children }: LedgerProviderProps) {
  const [config, setConfig] = useState<LedgerProviderConfig>(DEFAULT_CONFIG);
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<EIP6963ProviderDetail | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const configRef = useRef<LedgerProviderConfig>(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("@ledgerhq/ledger-wallet-provider").then((module) => {
      LedgerButtonModule = module;
      setIsLoaded(true);
    });
  }, []);

  const handleAnnounceProvider = useCallback(
    (e: CustomEvent<EIP6963ProviderDetail>) => {
      setProviders((prev) => {
        if (!prev) return [e.detail];

        // De-duplicate on rdns: a wallet keeps a stable rdns across
        // announcements, while uuid is regenerated each time, so keying on
        // uuid would list the same provider multiple times.
        const found = prev.find((p) => p.info.rdns === e.detail.info.rdns);
        if (found) return prev;

        return [...prev, { provider: e.detail.provider, info: e.detail.info }];
      });
    },
    [],
  );

  const initializeProviderWithConfig = useCallback(
    (configToUse: LedgerProviderConfig) => {
      if (!isLoaded || !LedgerButtonModule) return;

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      const { initializeLedgerProvider } = LedgerButtonModule;

      const disableEventTracking =
        process.env.NEXT_PUBLIC_DISABLE_EVENT_TRACKING === "true";

      const cleanup = initializeLedgerProvider({
        target: document.body,
        hideButton: configToUse.hideButton,
        floatingButtonPosition: configToUse.buttonPosition as
          | "bottom-right"
          | "bottom-left"
          | "top-right"
          | "top-left"
          | "middle-right",
        dAppIdentifier: configToUse.dAppIdentifier,
        apiKey: configToUse.apiKey,
        loggerLevel: configToUse.logLevel as
          | "debug"
          | "info"
          | "warn"
          | "error",
        environment: configToUse.environment as "production" | "staging",
        dmkConfig: undefined,
        walletTransactionFeatures: configToUse.walletTransactionFeatures,
        transactionConfirmationNotification:
          configToUse.transactionConfirmationNotification,
        blockchainProviderFactories: [
          { family: "ethereum", create: createEvmBlockchainProvider },
          { family: "solana", create: createSolanaBlockchainProvider },
        ],
        devConfig: disableEventTracking
          ? {
              stub: {
                base: disableEventTracking,
              },
            }
          : undefined,
      });

      cleanupRef.current = cleanup;
      setIsInitialized(true);

      window.addEventListener(
        "eip6963:announceProvider",
        handleAnnounceProvider as EventListener,
      );

      return () => {
        cleanup();
        window.removeEventListener(
          "eip6963:announceProvider",
          handleAnnounceProvider as EventListener,
        );
      };
    },
    [isLoaded, handleAnnounceProvider],
  );

  useEffect(() => {
    if (!isLoaded) return;

    const cleanup = initializeProviderWithConfig(configRef.current);
    return cleanup;
  }, [isLoaded, initializeProviderWithConfig]);

  const reinitialize = useCallback(
    (newConfig?: LedgerProviderConfig) => {
      const configToUse = newConfig || configRef.current;

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      setProviders([]);
      setSelectedProvider(null);
      setIsInitialized(false);

      initializeProviderWithConfig(configToUse);
    },
    [initializeProviderWithConfig],
  );

  const value: LedgerContextValue = {
    providers,
    selectedProvider,
    setSelectedProvider,
    isInitialized,
    reinitialize,
    config,
    setConfig,
  };

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
}

export function useLedgerContext(): LedgerContextValue {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error("useLedgerContext must be used within a <LedgerProvider>");
  }
  return context;
}
