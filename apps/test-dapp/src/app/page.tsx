"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

import {
  type EIPEvent,
  EventLogBlock,
  ProviderSelectionBlock,
  QuickActionsBlock,
  SettingsBlock,
  TransactionsBlock,
} from "../components";
import {
  DEFAULT_CONFIG,
  type LedgerProviderConfig,
  useProviders,
} from "../hooks/useProviders";

import styles from "./page.module.css";

let Provider:
  | typeof import("@ledgerhq/ledger-wallet-provider").LedgerEIP1193Provider
  | null = null;

export default function Index() {
  const [config, setConfig] = useState<LedgerProviderConfig>(DEFAULT_CONFIG);
  const {
    providers,
    selectedProvider,
    setSelectedProvider,
    isInitialized,
    reinitialize,
  } = useProviders(config);

  const [account, setAccount] = useState<string | null>(null);
  const [events, setEvents] = useState<EIPEvent[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("@ledgerhq/ledger-wallet-provider").then((module) => {
      Provider = module.LedgerEIP1193Provider;
    });
  }, []);

  const addEvent = useCallback((type: EIPEvent["type"], data: unknown) => {
    const event: EIPEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      timestamp: new Date(),
      data,
    };
    setEvents((prev) => [...prev, event]);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    if (!selectedProvider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("accountsChanged received", accounts);
      addEvent("accountsChanged", accounts);
      setAccount(accounts[0] || null);
    };

    const handleChainChanged = (chainId: string) => {
      console.log("chainChanged received", chainId);
      addEvent("chainChanged", chainId);
    };

    const handleDisconnect = () => {
      console.log("disconnect received");
      addEvent("disconnect", null);
    };

    selectedProvider.provider.on("accountsChanged", handleAccountsChanged);
    selectedProvider.provider.on("chainChanged", handleChainChanged);
    selectedProvider.provider.on("disconnect", handleDisconnect);

    return () => {
      selectedProvider.provider.removeListener(
        "accountsChanged",
        handleAccountsChanged,
      );
      selectedProvider.provider.removeListener(
        "chainChanged",
        handleChainChanged,
      );
      selectedProvider.provider.removeListener("disconnect", handleDisconnect);
    };
  }, [selectedProvider, addEvent]);

  // Request providers (EIP-6963)
  const dispatchRequestProvider = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }, []);

  const handleRequestAccounts = useCallback(async () => {
    if (!selectedProvider) return;

    setError(null);
    try {
      const accounts = (await selectedProvider.provider.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[];
      if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    } catch (err) {
      console.error(err);
      setError((err as Error)?.message ?? "Unknown error");
    }
  }, [selectedProvider, account]);

  const handleDisconnect = useCallback(() => {
    if (!selectedProvider) return;

    if (Provider && selectedProvider.provider instanceof Provider) {
      console.log("disconnecting from eip1193 provider");
      selectedProvider.provider.disconnect();
    }

    setSelectedProvider(null);
    setAccount(null);
    setResult(null);
    setError(null);
  }, [selectedProvider, setSelectedProvider]);

  const handleOpenHome = useCallback(() => {
    if (!selectedProvider) return;
    if (Provider && selectedProvider.provider instanceof Provider) {
      selectedProvider.provider.navigationIntent("home");
    }
  }, [selectedProvider]);

  const handleOpenSettings = useCallback(() => {
    if (!selectedProvider) return;
    if (Provider && selectedProvider.provider instanceof Provider) {
      selectedProvider.provider.navigationIntent("settings");
    }
  }, [selectedProvider]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const handleSignTransaction = useCallback(
    async (txJson: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        const tx = JSON.parse(txJson);
        console.log("JSON RPC eth_signTransaction TX ", tx);
        const res = (await selectedProvider.provider.request({
          method: "eth_signTransaction",
          params: [tx],
        })) as string;
        setResult(res);
        console.log({ result: res });
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider],
  );

  const handleSendTransaction = useCallback(
    async (txJson: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        const tx = JSON.parse(txJson);
        console.log("JSON RPC eth_sendTransaction TX ", tx);
        const res = (await selectedProvider.provider.request({
          method: "eth_sendTransaction",
          params: [tx],
        })) as string;
        setResult(res);
        console.log({ result: res });
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider],
  );

  const handleSignRawTransaction = useCallback(
    async (rawTx: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        console.log("JSON RPC eth_signRawTransaction TX ", rawTx);
        const transx = ethers.Transaction.from(rawTx);
        console.log("JSON RPC eth_signRawTransaction Ethers Transaction", {
          transx,
        });

        const res = (await selectedProvider.provider.request({
          method: "eth_signRawTransaction",
          params: [rawTx],
        })) as string;
        setResult(res);
        console.log({ transaction: res });
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider],
  );

  const handleSignTypedData = useCallback(
    async (typedDataJson: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        const typedData = JSON.parse(typedDataJson);
        const res = (await selectedProvider.provider.request({
          method: "eth_signTypedData_v4",
          params: [account, typedData],
        })) as string;
        console.log({ result: res });
        setResult(res);
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider, account],
  );

  const handleSignPersonalMessage = useCallback(
    async (message: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        const res = (await selectedProvider.provider.request({
          method: "eth_sign",
          params: [account, message],
        })) as string;
        setResult(res);
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider, account],
  );

  const handleProviderRequest = useCallback(
    async (method: string, paramsJson: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        const params = JSON.parse(paramsJson);
        console.log("handleProviderRequest", { method, params });

        const res = await selectedProvider.provider.request({
          // @ts-expect-error - Supress RpcMethods error
          method,
          params,
        });

        console.log("handleProviderRequest result", { result: res });
        setResult(JSON.stringify(res));
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider],
  );

  return (
    <div className={styles.page}>
      <div className={styles["page__container"]}>
        <header className={styles["page__header"]}>
          <h1 className={styles["page__title"]}>Ledger Button Test dApp</h1>
          <p className={styles["page__subtitle"]}>
            Test EIP-1193 / EIP-6963 provider integration
          </p>
        </header>

        <div className={styles["page__blocks"]}>
          <SettingsBlock
            config={config}
            onConfigChange={setConfig}
            isProviderInitialized={isInitialized}
            onReinitialize={reinitialize}
          />

          <ProviderSelectionBlock
            providers={providers}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            onRequestProviders={dispatchRequestProvider}
            onDisconnect={handleDisconnect}
            account={account}
          />

          <QuickActionsBlock
            isConnected={selectedProvider !== null}
            hasAccount={account !== null}
            onOpenHome={handleOpenHome}
            onOpenSettings={handleOpenSettings}
            onRequestAccounts={handleRequestAccounts}
          />

          <TransactionsBlock
            isConnected={selectedProvider !== null}
            hasAccount={account !== null}
            account={account}
            onSignTransaction={handleSignTransaction}
            onSendTransaction={handleSendTransaction}
            onSignRawTransaction={handleSignRawTransaction}
            onSignTypedData={handleSignTypedData}
            onSignPersonalMessage={handleSignPersonalMessage}
            onProviderRequest={handleProviderRequest}
            result={result}
            error={error}
            onClearResult={clearResult}
          />

          <EventLogBlock events={events} onClearEvents={clearEvents} />
        </div>
      </div>
    </div>
  );
}
