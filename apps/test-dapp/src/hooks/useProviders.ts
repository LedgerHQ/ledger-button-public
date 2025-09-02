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
      dAppIdentifier: "test-dapp",
      stub: {
        base: true,
        device: false,
        web3Provider: true,
      },
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
