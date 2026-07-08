"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown as ChevronDownIcon } from "@ledgerhq/lumen-ui-react/symbols";
import { ethers } from "ethers";

import {
  type ActivityEntry,
  ActivityLog,
  ConnectionStatus,
  type EIPEvent,
  EventSimulatorBlock,
  ProviderSelectionBlock,
  SettingsBlock,
  TrackingPanel,
  TransactionsBlock,
} from "../components";
import {
  DEFAULT_CONFIG,
  type LedgerProviderConfig,
  useProviders,
} from "../hooks/useProviders";
import { useTrackingInterceptor } from "../hooks/useTrackingInterceptor";

let Provider:
  | typeof import("@ledgerhq/ledger-wallet-provider").LedgerEIP1193Provider
  | null = null;

let activityCounter = 0;
function nextActivityId(): string {
  activityCounter += 1;
  return `${Date.now()}-${activityCounter}`;
}

export default function Index() {
  const [config, setConfig] = useState<LedgerProviderConfig>(DEFAULT_CONFIG);
  const {
    providers,
    selectedProvider,
    setSelectedProvider,
    isInitialized,
    reinitialize,
  } = useProviders(config);

  const { entries: trackingEntries, clearEntries: clearTracking } =
    useTrackingInterceptor();

  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prevResultRef = useRef<string | null>(null);
  const prevErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("@ledgerhq/ledger-wallet-provider").then((module) => {
      Provider = module.LedgerEIP1193Provider;
    });
  }, []);

  useEffect(() => {
    if (result && result !== prevResultRef.current) {
      setActivity((prev) => [
        ...prev,
        {
          id: nextActivityId(),
          kind: "result",
          label: "Result",
          timestamp: new Date(),
          data: result,
        },
      ]);
    }
    prevResultRef.current = result;
  }, [result]);

  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      setActivity((prev) => [
        ...prev,
        {
          id: nextActivityId(),
          kind: "error",
          label: "Error",
          timestamp: new Date(),
          data: error,
        },
      ]);
    }
    prevErrorRef.current = error;
  }, [error]);

  const addEvent = useCallback((type: EIPEvent["type"], data: unknown) => {
    setActivity((prev) => [
      ...prev,
      {
        id: nextActivityId(),
        kind: "event",
        label: type,
        timestamp: new Date(),
        data,
      },
    ]);
  }, []);

  const addInfoEntry = useCallback((label: string, data?: unknown) => {
    setActivity((prev) => [
      ...prev,
      {
        id: nextActivityId(),
        kind: "info",
        label,
        timestamp: new Date(),
        data,
      },
    ]);
  }, []);

  const clearActivity = useCallback(() => {
    setActivity([]);
  }, []);

  useEffect(() => {
    if (!selectedProvider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("accountsChanged received", accounts);
      addEvent("accountsChanged", accounts);
      setAccount(accounts[0] || null);
    };

    const handleChainChanged = (newChainId: string) => {
      console.log("chainChanged received", newChainId);
      addEvent("chainChanged", newChainId);
      setChainId(newChainId);
    };

    const handleDisconnect = () => {
      console.log("disconnect received");
      setSelectedProvider(null);
      setAccount(null);
      setChainId(null);
      setResult(null);
      setError(null);
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

  const accountRef = useRef(account);
  accountRef.current = account;

  useEffect(() => {
    if (!selectedProvider || accountRef.current) return;

    addInfoEntry("Requesting accounts…");
    selectedProvider.provider
      .request({ method: "eth_requestAccounts", params: [] })
      .then((accounts) => {
        const accs = accounts as string[];
        if (accs[0]) {
          setAccount(accs[0]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError((err as Error)?.message ?? "Unknown error");
      });
  }, [selectedProvider, addInfoEntry]);

  // Request providers (EIP-6963)
  const dispatchRequestProvider = useCallback(() => {
    if (typeof window === "undefined") return;
    addInfoEntry("Discovering providers…");
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }, [addInfoEntry]);

  const handleDisconnect = useCallback(() => {
    if (!selectedProvider) return;

    if (Provider && selectedProvider.provider instanceof Provider) {
      console.log("disconnecting from eip1193 provider");
      selectedProvider.provider.disconnect();
    }

    addInfoEntry("Disconnected");
    setSelectedProvider(null);
    setAccount(null);
    setChainId(null);
    setResult(null);
    setError(null);
  }, [selectedProvider, setSelectedProvider, addInfoEntry]);

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
        addInfoEntry("eth_signTransaction", tx);
        const res = (await selectedProvider.provider.request({
          method: "eth_signTransaction",
          params: [tx],
        })) as string;
        setResult(res);
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider, addInfoEntry],
  );

  const handleSendTransaction = useCallback(
    async (txJson: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        const tx = JSON.parse(txJson);
        addInfoEntry("eth_sendTransaction", tx);
        const res = (await selectedProvider.provider.request({
          method: "eth_sendTransaction",
          params: [tx],
        })) as string;
        setResult(res);
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider, addInfoEntry],
  );

  const handleSignRawTransaction = useCallback(
    async (rawTx: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        addInfoEntry("eth_signRawTransaction", rawTx);
        const transx = ethers.Transaction.from(rawTx);
        console.log("JSON RPC eth_signRawTransaction Ethers Transaction", {
          transx,
        });

        const res = (await selectedProvider.provider.request({
          method: "eth_signRawTransaction",
          params: [rawTx],
        })) as string;
        setResult(res);
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider, addInfoEntry],
  );

  const handleSignTypedData = useCallback(
    async (typedDataJson: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        const typedData = JSON.parse(typedDataJson);
        addInfoEntry("eth_signTypedData_v4", typedData);
        const res = (await selectedProvider.provider.request({
          method: "eth_signTypedData_v4",
          params: [account, typedData],
        })) as string;
        setResult(res);
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider, account, addInfoEntry],
  );

  const handleSignPersonalMessage = useCallback(
    async (message: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        addInfoEntry("eth_sign (personal)", message);
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
    [selectedProvider, account, addInfoEntry],
  );

  const handleProviderRequest = useCallback(
    async (method: string, paramsJson: string) => {
      if (!selectedProvider) return;
      setResult(null);
      setError(null);

      try {
        const params = JSON.parse(paramsJson);
        addInfoEntry(`RPC: ${method}`, params);

        const res = await selectedProvider.provider.request({
          // @ts-expect-error - Supress RpcMethods error
          method,
          params,
        });

        setResult(JSON.stringify(res));
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message ?? String(err));
      }
    },
    [selectedProvider, addInfoEntry],
  );

  return (
    <div className="bg-canvas min-h-full p-24">
      <div className="mx-auto flex max-w-[1440px] gap-24">
        <div className="max-w-[720px] min-w-0 flex-1">
          <header className="mb-24">
            <h1 className="heading-3 mb-6 text-base">
              Ledger Button Test dApp
            </h1>
            <p className="body-2 text-muted">
              Test EIP-1193 / EIP-6963 provider integration
            </p>
          </header>

          <div className="flex flex-col gap-20">
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
              apiKey={config.apiKey}
            />

            <EventSimulatorBlock
              environment={config.environment}
              dAppIdentifier={config.dAppIdentifier}
              apiKey={config.apiKey}
            />
          </div>
        </div>

        <aside className="hidden w-[400px] shrink-0 lg:block">
          <div className="sticky top-24 flex max-h-[calc(100vh-48px)] flex-col gap-20">
            <div className="shrink-0">
              <ConnectionStatus
                selectedProvider={selectedProvider}
                account={account}
                chainId={chainId}
                isInitialized={isInitialized}
                transactionConfirmationNotification={
                  config.transactionConfirmationNotification
                }
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <ActivityLog entries={activity} onClear={clearActivity} />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <TrackingPanel
                entries={trackingEntries}
                onClear={clearTracking}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="mx-auto mt-16 max-w-[680px] space-y-8 lg:hidden">
        <details className="group">
          <summary className="border-muted bg-muted flex cursor-pointer items-center justify-between rounded-lg border px-20 py-14 select-none">
            <span className="body-2-semi-bold text-base">
              Activity Log
              {activity.length > 0 && (
                <span className="text-muted ml-8">({activity.length})</span>
              )}
            </span>
            <span className="text-muted transition-transform group-open:rotate-180">
              <ChevronDownIcon size={16} />
            </span>
          </summary>
          <div className="mt-8 h-[400px]">
            <ActivityLog entries={activity} onClear={clearActivity} />
          </div>
        </details>

        <details className="group">
          <summary className="border-muted bg-muted flex cursor-pointer items-center justify-between rounded-lg border px-20 py-14 select-none">
            <span className="body-2-semi-bold text-base">
              Tracking Events
              {trackingEntries.length > 0 && (
                <span className="text-muted ml-8">
                  ({trackingEntries.length})
                </span>
              )}
            </span>
            <span className="text-muted transition-transform group-open:rotate-180">
              <ChevronDownIcon size={16} />
            </span>
          </summary>
          <div className="mt-8 h-[400px]">
            <TrackingPanel entries={trackingEntries} onClear={clearTracking} />
          </div>
        </details>
      </div>
    </div>
  );
}
