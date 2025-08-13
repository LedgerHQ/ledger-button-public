"use client";

import { useEffect, useState } from "react";
import {
  type EIP1193Provider,
  initializeLedgerProvider,
} from "@ledgerhq/ledger-button";

import styles from "./page.module.css";

export default function Index() {
  const [provider, setProvider] = useState<EIP1193Provider | null>(null);

  const handleAnnounceProvider = (
    e: CustomEvent<{ provider: EIP1193Provider }>,
  ) => {
    setProvider(e.detail.provider);
  };

  const requestAccounts = async () => {
    if (!provider) return;
    await provider.request({
      method: "eth_requestAccounts",
      params: [],
    });
  };

  useEffect(() => {
    const cleanup = initializeLedgerProvider({
      stub: true,
      stubDevice: false,
      stubWeb3Provider: true,
    });

    window.addEventListener("eip6963:announceProvider", handleAnnounceProvider);

    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      cleanup();
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnounceProvider,
      );
    };
  }, []);

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      console.log("accountsChanged", accounts);
    };
    provider?.on("accountsChanged", handleAccountsChanged);

    return () => {
      provider?.removeListener("accountsChanged", handleAccountsChanged);
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
