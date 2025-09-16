import { useCallback, useEffect, useState } from "react";
import type { EIP6963ProviderDetail } from "@ledgerhq/ledger-button";

let LedgerButtonModule: typeof import("@ledgerhq/ledger-button") | null = null;

export const useProviders = () => {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<EIP6963ProviderDetail | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("@ledgerhq/ledger-button").then((module) => {
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

    const cleanup = initializeLedgerProvider({
      devConfig: {
        stub: {
          base: false,
          account: false,
          device: false,
          dAppConfig: false, // NOTE: stub the config until the backend is ready
          web3Provider: false,
        },
      },
      target: document.body,
      dAppIdentifier: "1inch",
      apiKey:
        "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
      loggerLevel: "info",
      dmkConfig: undefined,
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
