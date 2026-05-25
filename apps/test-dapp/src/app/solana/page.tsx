"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown as ChevronDownIcon } from "@ledgerhq/lumen-ui-react/symbols";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import dynamic from "next/dynamic";

import { type ActivityEntry, ActivityLog } from "../../components";
import {
  DEFAULT_SOLANA_CLUSTER,
  SolanaActionsBlock,
  type SolanaCluster,
  SolanaConnectionStatus,
  SolanaSettingsBlock,
  WalletSelectionBlock,
} from "../../components/solana";
import { type SolanaTransferValues } from "../../components/solana/modals";

const SolanaProviders = dynamic(
  () => import("../../components/solana/SolanaProviders"),
  { ssr: false },
);

let activityCounter = 0;
function nextActivityId(): string {
  activityCounter += 1;
  return `${Date.now()}-${activityCounter}`;
}

export default function SolanaPage() {
  const [cluster, setCluster] = useState<SolanaCluster>(DEFAULT_SOLANA_CLUSTER);

  return (
    <SolanaProviders cluster={cluster}>
      <SolanaPageContent cluster={cluster} onClusterChange={setCluster} />
    </SolanaProviders>
  );
}

interface SolanaPageContentProps {
  cluster: SolanaCluster;
  onClusterChange: (cluster: SolanaCluster) => void;
}

function SolanaPageContent({
  cluster,
  onClusterChange,
}: SolanaPageContentProps) {
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    signMessage,
    signTransaction,
    sendTransaction,
  } = useWallet();

  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prevResultRef = useRef<string | null>(null);
  const prevErrorRef = useRef<string | null>(null);

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

  const addInfo = useCallback((label: string, data?: unknown) => {
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

  const addError = useCallback((message: string) => {
    setError(message);
  }, []);

  const clearActivity = useCallback(() => {
    setActivity([]);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const buildTransferTransaction = useCallback(
    async ({ recipient, lamports }: SolanaTransferValues) => {
      if (!publicKey) throw new Error("Wallet not connected");
      const toPubkey = new PublicKey(recipient);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const tx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey,
          lamports,
        }),
      );
      return tx;
    },
    [connection, publicKey],
  );

  const handleSignMessage = useCallback(
    async (message: string) => {
      if (!signMessage) {
        setError("Selected wallet does not support signMessage");
        return;
      }
      setResult(null);
      setError(null);
      try {
        addInfo("signMessage", message);
        const bytes = new TextEncoder().encode(message);
        const signature = await signMessage(bytes);
        setResult(bs58.encode(signature));
      } catch (err) {
        setError((err as Error)?.message ?? String(err));
      }
    },
    [signMessage, addInfo],
  );

  const handleSignTransaction = useCallback(
    async (values: SolanaTransferValues) => {
      if (!signTransaction) {
        setError("Selected wallet does not support signTransaction");
        return;
      }
      setResult(null);
      setError(null);
      try {
        addInfo("signTransaction (SystemProgram.transfer)", values);
        const tx = await buildTransferTransaction(values);
        const signed = await signTransaction(tx);
        setResult(signed.serialize().toString("base64"));
      } catch (err) {
        setError((err as Error)?.message ?? String(err));
      }
    },
    [signTransaction, addInfo, buildTransferTransaction],
  );

  const handleSendTransaction = useCallback(
    async (values: SolanaTransferValues) => {
      setResult(null);
      setError(null);
      try {
        addInfo("sendTransaction (SystemProgram.transfer)", values);
        const tx = await buildTransferTransaction(values);
        const signature = await sendTransaction(tx, connection);
        addInfo(`Sent — signature ${signature.slice(0, 12)}…`);
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });
        if (confirmation.value.err) {
          throw new Error(JSON.stringify(confirmation.value.err));
        }
        setResult(signature);
      } catch (err) {
        setError((err as Error)?.message ?? String(err));
      }
    },
    [sendTransaction, connection, addInfo, buildTransferTransaction],
  );

  const isConnected = connected && publicKey !== null;

  const headerSubtitle = useMemo(
    () =>
      `Wallet Standard discovery on Solana ${cluster.replace("-beta", " beta")}`,
    [cluster],
  );

  return (
    <div className="bg-canvas min-h-full p-24">
      <div className="mx-auto flex max-w-[1440px] gap-24">
        <div className="max-w-[720px] min-w-0 flex-1">
          <header className="mb-24">
            <h1 className="heading-3 mb-6 text-base">
              Ledger Button Test dApp · Solana
            </h1>
            <p className="body-2 text-muted">{headerSubtitle}</p>
          </header>

          <div className="flex flex-col gap-20">
            <SolanaSettingsBlock
              cluster={cluster}
              onClusterChange={onClusterChange}
            />

            <WalletSelectionBlock onLog={addInfo} onError={addError} />

            <SolanaActionsBlock
              isConnected={isConnected}
              canSignMessage={Boolean(signMessage)}
              canSignTransaction={Boolean(signTransaction)}
              onSignMessage={handleSignMessage}
              onSignTransaction={handleSignTransaction}
              onSendTransaction={handleSendTransaction}
              result={result}
              error={error}
              onClearResult={clearResult}
            />
          </div>
        </div>

        <aside className="hidden w-[400px] shrink-0 lg:block">
          <div className="sticky top-24 flex max-h-[calc(100vh-48px)] flex-col gap-20">
            <div className="shrink-0">
              <SolanaConnectionStatus cluster={cluster} />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <ActivityLog entries={activity} onClear={clearActivity} />
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
      </div>
    </div>
  );
}
