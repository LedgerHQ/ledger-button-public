import { useCallback, useEffect, useRef,useState } from "react";
import type { EIP6963ProviderDetail } from "@ledgerhq/ledger-wallet-provider";

let LedgerButtonModule:
  | typeof import("@ledgerhq/ledger-wallet-provider")
  | null = null;

export interface LedgerProviderConfig {
  dAppIdentifier: string;
  apiKey: string;
  buttonPosition: string;
  logLevel: string;
  environment: string;
}

export const DEFAULT_CONFIG: LedgerProviderConfig = {
  dAppIdentifier: "1inch",
  apiKey: "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
  buttonPosition: "bottom-right",
  logLevel: "info",
  environment: "production",
};

export const useProviders = (config: LedgerProviderConfig = DEFAULT_CONFIG) => {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<EIP6963ProviderDetail | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

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

        const found = prev.find((p) => p.info.uuid === e.detail.info.uuid);
        if (found) return prev;

        return [...prev, { provider: e.detail.provider, info: e.detail.info }];
      });
    },
    [],
  );

  const initializeProvider = useCallback(() => {
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
      floatingButtonTarget: "#floating-button-container",
      dAppIdentifier: config.dAppIdentifier,
      apiKey: config.apiKey,
      loggerLevel: config.logLevel as "debug" | "info" | "warn" | "error",
      environment: config.environment as "production" | "staging",
      dmkConfig: undefined,
      devConfig: disableEventTracking
        ? {
            stub: {
              base: true,
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
  }, [isLoaded, config, handleAnnounceProvider]);

  useEffect(() => {
    const cleanup = initializeProvider();
    return cleanup;
  }, [initializeProvider]);

  const reinitialize = useCallback(() => {
    setProviders([]);
    setSelectedProvider(null);
    setIsInitialized(false);

    initializeProvider();
  }, [initializeProvider]);

  return {
    providers,
    selectedProvider,
    setSelectedProvider,
    isInitialized,
    reinitialize,
  };
};
