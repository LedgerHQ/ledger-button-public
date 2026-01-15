import { useCallback, useEffect, useState } from "react";
import type { EIP6963ProviderDetail } from "@ledgerhq/ledger-wallet-provider";

let LedgerButtonModule:
  | typeof import("@ledgerhq/ledger-wallet-provider")
  | null = null;

export const useProviders = () => {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<EIP6963ProviderDetail | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

  useEffect(() => {
    if (!isLoaded || !LedgerButtonModule) return;

    const { initializeLedgerProvider } = LedgerButtonModule;

    const disableEventTracking =
      process.env.NEXT_PUBLIC_DISABLE_EVENT_TRACKING === "true";

    const cleanup = initializeLedgerProvider({
      target: document.body,
      // floatingButtonPosition: "bottom-right",
      floatingButtonTarget: "#floating-button-container",
      dAppIdentifier: "1inch",
      apiKey:
        "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
      loggerLevel: "info",
      environment: "production",
      dmkConfig: undefined,
      walletTransactionFeatures: ["send", "receive", "swap", "buy", "earn", "sell"],
      devConfig: disableEventTracking
        ? {
            stub: {
              base: true,
            },
          }
        : undefined,
    });

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
  }, [isLoaded, handleAnnounceProvider]);

  return {
    providers,
    selectedProvider,
    setSelectedProvider,
  };
};
