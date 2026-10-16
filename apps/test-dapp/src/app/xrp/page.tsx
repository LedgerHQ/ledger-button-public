"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  LedgerXrpApi,
  XrpAccountInfo,
} from "@ledgerhq/ledger-wallet-provider-xrp";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";

import {
  type ActivityEntry,
  ActivityLog,
  DeviceScreen,
  MockServerStatusBox,
} from "../../components";
import {
  buildMessageProofTransaction,
  buildPayment,
  type PaymentValues,
  XrpActionsBlock,
} from "../../components/xrp";
import { useMockServer } from "../../hooks/useMockServer";
import { useProviders } from "../../hooks/useProviders";

const REQUEST_PROVIDER_EVENT = "ledger-xrpl:requestProvider";
const ANNOUNCE_PROVIDER_EVENT = "ledger-xrpl:announceProvider";

type XrpProviderDetail = {
  info: { uuid: string; name: string; rdns: string };
  provider: LedgerXrpApi;
};

let activityCounter = 0;
function nextActivityId(): string {
  activityCounter += 1;
  return `${Date.now()}-${activityCounter}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function XrpPage() {
  const { reinitialize, isInitialized } = useProviders();
  const mockServer = useMockServer(reinitialize);

  const [provider, setProvider] = useState<XrpProviderDetail | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const log = useCallback(
    (kind: ActivityEntry["kind"], label: string, data?: unknown) => {
      setActivity((prev) => [
        ...prev,
        { id: nextActivityId(), kind, label, timestamp: new Date(), data },
      ]);
    },
    [],
  );

  const clearActivity = useCallback(() => setActivity([]), []);

  useEffect(() => {
    if (!isInitialized) return;

    const onAnnounce = (event: Event) => {
      setProvider((event as CustomEvent<XrpProviderDetail>).detail);
    };
    window.addEventListener(ANNOUNCE_PROVIDER_EVENT, onAnnounce);
    window.dispatchEvent(new Event(REQUEST_PROVIDER_EVENT));

    return () => {
      window.removeEventListener(ANNOUNCE_PROVIDER_EVENT, onAnnounce);
    };
  }, [isInitialized]);

  useEffect(() => {
    if (!provider) return;

    const onAccountChanged = (data: unknown) => {
      const account = data as XrpAccountInfo | null;
      setAddress(account?.address ?? null);
      log("info", "accountChanged", account);
    };
    provider.provider.on("accountChanged", onAccountChanged);

    return () => {
      provider.provider.off("accountChanged", onAccountChanged);
    };
  }, [provider, log]);

  const run = useCallback(
    async <T,>(label: string, action: () => Promise<T>): Promise<T | null> => {
      setIsBusy(true);
      try {
        const value = await action();
        log("result", label, value);
        return value;
      } catch (error) {
        log("error", label, errorMessage(error));
        return null;
      } finally {
        setIsBusy(false);
      }
    },
    [log],
  );

  const handleConnect = useCallback(async () => {
    if (!provider) return;
    const connected = await run("connect", () => provider.provider.connect());
    if (connected) setAddress(connected.address);
  }, [provider, run]);

  const handleDisconnect = useCallback(async () => {
    if (!provider) return;
    await run("disconnect", () => provider.provider.disconnect());
    setAddress(null);
  }, [provider, run]);

  const handleSign = useCallback(
    (values: PaymentValues) => {
      if (!provider || !address) return;
      void run("sign", async () => {
        const tx = await buildPayment(address, values);
        log("info", "Payment to sign", tx);
        return provider.provider.sign(tx);
      });
    },
    [provider, address, run, log],
  );

  const handleSignMessage = useCallback(
    (message: string) => {
      if (!provider || !address) return;
      void run("signMessage (fake, memo transaction)", async () => {
        const tx = buildMessageProofTransaction(message);
        log("info", "Message proof transaction to sign", tx);
        return provider.provider.sign(tx);
      });
    },
    [provider, address, run, log],
  );

  const handleSignAndSubmit = useCallback(
    (values: PaymentValues) => {
      if (!provider || !address) return;
      void run("signAndSubmit", async () => {
        const tx = await buildPayment(address, values);
        log("info", "Payment to sign and submit", tx);
        return provider.provider.signAndSubmit(tx);
      });
    },
    [provider, address, run, log],
  );

  return (
    <div className="bg-canvas min-h-full p-24">
      <div className="mx-auto flex max-w-[1440px] gap-24">
        <div className="max-w-[720px] min-w-0 flex-1">
          <header className="mb-24">
            <h1 className="heading-3 mb-6 text-base">
              Ledger Button Test dApp · XRP
            </h1>
            <p className="body-2 text-muted">
              Provider discovery via ledger-xrpl:requestProvider /
              ledger-xrpl:announceProvider
            </p>
          </header>

          <div className="flex flex-col gap-20">
            <div className="border-muted bg-canvas rounded-lg border p-20">
              <div className="mb-14 flex items-center justify-between">
                <span className="body-2-semi-bold text-muted tracking-wider uppercase">
                  Wallet
                </span>
                <Tag
                  appearance={provider ? "success" : "gray"}
                  size="sm"
                  label={provider ? provider.info.name : "Not found"}
                />
              </div>
              {address ? (
                <>
                  <span className="body-2 text-muted mb-4 block">Address</span>
                  <span className="body-2-semi-bold mb-14 block font-mono text-base break-all">
                    {address}
                  </span>
                  <Button
                    appearance="gray"
                    size="sm"
                    disabled={isBusy}
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  appearance="accent"
                  size="sm"
                  disabled={!provider || isBusy}
                  onClick={handleConnect}
                >
                  Connect Ledger
                </Button>
              )}
            </div>

            <XrpActionsBlock
              address={address}
              isBusy={isBusy}
              onSign={handleSign}
              onSignMessage={handleSignMessage}
              onSignAndSubmit={handleSignAndSubmit}
            />
          </div>
        </div>

        <DeviceScreen />

        <aside className="hidden w-[400px] shrink-0 lg:block">
          <div className="sticky top-24 flex max-h-[calc(100vh-48px)] flex-col gap-20">
            <div className="shrink-0">
              <MockServerStatusBox mockServer={mockServer} />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <ActivityLog entries={activity} onClear={clearActivity} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
