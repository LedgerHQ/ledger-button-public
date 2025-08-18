"use client";

import { useCallback, useEffect, useState } from "react";

import styles from "./page.module.css";

// Create a wrapper for the ledger-button module that handles SSR
let LedgerButtonModule: typeof import("ledger-button") | null = null;

export default function Index() {
  // Define proper types for the provider
  type Provider = {
    request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
    on: (event: string, handler: (data: any) => void) => void;
    removeListener: (event: string, handler: (data: any) => void) => void;
  };

  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the ledger-button module on the client side
  useEffect(() => {
    // Only import in browser environment
    if (typeof window !== "undefined") {
      import("ledger-button").then((module) => {
        LedgerButtonModule = module;
        setIsLoaded(true);
      });
    }
  }, []);

  const handleAnnounceProvider = useCallback(
    (e: CustomEvent<{ provider: Provider }>) => {
      setProvider(e.detail.provider);
    },
    [],
  );

  const requestAccounts = async () => {
    if (!provider) return;
    await provider.request({
      method: "eth_requestAccounts",
      params: [],
    });
  };

  useEffect(() => {
    if (!isLoaded || !LedgerButtonModule) return;

    const { initializeLedgerProvider } = LedgerButtonModule;

    const cleanup = initializeLedgerProvider({
      stub: true,
      stubDevice: false,
      stubWeb3Provider: true,
    });

    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnounceProvider as EventListener,
    );
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      cleanup();
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnounceProvider as EventListener,
      );
    };
  }, [isLoaded, handleAnnounceProvider]);

  useEffect(() => {
    if (!provider) return;

    // Type assertion for the specific event handler
    const handleAccountsChanged = ((accounts: string[]) => {
      console.log("accountsChanged", accounts);
    }) as (data: any) => void;

    provider.on("accountsChanged", handleAccountsChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [provider]);

  return (
    <div className={styles.page}>
      <div className="wrapper">
        <div className="container">
          <div id="actions">
            <button onClick={requestAccounts}>Connect to Ledger</button>
          </div>

          <p id="love">
            Carefully crafted with
            <svg
              fill="currentColor"
              stroke="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </p>
        </div>
      </div>
    </div>
  );
}
