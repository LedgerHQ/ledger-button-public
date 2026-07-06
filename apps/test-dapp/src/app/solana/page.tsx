"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown as ChevronDownIcon } from "@ledgerhq/lumen-ui-react/symbols";
import {
  address,
  appendTransactionMessageInstruction,
  createTransactionMessage,
  getBase58Decoder,
  getBase64EncodedWireTransaction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  signTransactionMessageWithSigners,
  type TransactionSigner,
} from "@solana/kit";
import {
  useSelectedWalletAccount,
  useSignMessage,
  useWalletAccountTransactionSendingSigner,
  useWalletAccountTransactionSigner,
} from "@solana/react";
import { getTransferSolInstruction } from "@solana-program/system";
import { type UiWalletAccount } from "@wallet-standard/react";
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
import {
  type SolanaRpc,
  useSolanaChain,
} from "../../components/solana/solanaChainContext";
import { type SolanaChain } from "../../components/solana/solanaCluster";
import { useProviders } from "../../hooks/useProviders";

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

  // Initialize the Ledger provider so it registers itself as a Solana wallet
  // (via Wallet Standard `registerWallet`) and becomes discoverable on this page
  // even when the user lands here directly without visiting the EVM page first.
  useProviders();

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
  // Safe here because this subtree is rendered inside <SolanaProviders>.
  const [selectedAccount] = useSelectedWalletAccount();

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

  const clearActivity = useCallback(() => {
    setActivity([]);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const headerSubtitle = useMemo(
    () => `Wallet Standard discovery on Solana ${cluster}`,
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

            <WalletSelectionBlock onLog={addInfo} onError={setError} />

            {selectedAccount ? (
              <ConnectedSolanaActions
                account={selectedAccount}
                addInfo={addInfo}
                onResult={setResult}
                onError={setError}
                result={result}
                error={error}
                onClearResult={clearResult}
              />
            ) : (
              <SolanaActionsBlock
                isConnected={false}
                canSignMessage={false}
                canSignTransaction={false}
                canSendTransaction={false}
                onSignMessage={async () => undefined}
                onSignTransaction={async () => undefined}
                onSendTransaction={async () => undefined}
                result={result}
                error={error}
                onClearResult={clearResult}
              />
            )}
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

interface ConnectedSolanaActionsProps {
  account: UiWalletAccount;
  addInfo: (label: string, data?: unknown) => void;
  onResult: (value: string) => void;
  onError: (message: string) => void;
  result: string | null;
  error: string | null;
  onClearResult: () => void;
}

type SolanaActionsCallbacks = Omit<
  ConnectedSolanaActionsProps,
  "account" | "result" | "error"
>;

function ConnectedSolanaActions(props: ConnectedSolanaActionsProps) {
  const { account } = props;
  const canSignAndSend = account.features.includes(
    "solana:signAndSendTransaction",
  );
  const canSignTransaction = account.features.includes(
    "solana:signTransaction",
  );

  if (canSignAndSend) {
    return <ConnectedSolanaActionsWithSend {...props} />;
  }

  if (canSignTransaction) {
    return <ConnectedSolanaActionsWithSignTx {...props} />;
  }

  return <ConnectedSolanaSignMessageActions {...props} />;
}

function ConnectedSolanaSignMessageActions({
  account,
  addInfo,
  onResult,
  onError,
  onClearResult,
  result,
  error,
}: ConnectedSolanaActionsProps) {
  const signMessage = useSignMessage(account);
  const canSignMessage = account.features.includes("solana:signMessage");

  const handleSignMessage = useCallback(
    async (message: string) => {
      onClearResult();
      try {
        addInfo("signMessage", message);
        const { signature } = await signMessage({
          message: new TextEncoder().encode(message),
        });
        onResult(getBase58Decoder().decode(signature));
      } catch (err) {
        onError((err as Error)?.message ?? String(err));
      }
    },
    [signMessage, addInfo, onResult, onError, onClearResult],
  );

  return (
    <SolanaActionsBlock
      isConnected
      canSignMessage={canSignMessage}
      canSignTransaction={false}
      canSendTransaction={false}
      onSignMessage={handleSignMessage}
      onSignTransaction={async () => undefined}
      onSendTransaction={async () => undefined}
      result={result}
      error={error}
      onClearResult={onClearResult}
    />
  );
}

function ConnectedSolanaActionsWithSignTx({
  account,
  addInfo,
  onResult,
  onError,
  onClearResult,
  result,
  error,
}: ConnectedSolanaActionsProps) {
  const { chain, rpc } = useSolanaChain();
  const signMessage = useSignMessage(account);
  const transactionSigner = useWalletAccountTransactionSigner(account, chain);

  const canSignMessage = account.features.includes("solana:signMessage");
  const canSignTransaction = account.features.includes(
    "solana:signTransaction",
  );

  const handleSignMessage = useSignMessageHandler({
    signMessage,
    addInfo,
    onResult,
    onError,
    onClearResult,
  });

  const handleSignTransaction = useSignTransactionHandler({
    rpc,
    chain,
    transactionSigner,
    addInfo,
    onResult,
    onError,
    onClearResult,
  });

  return (
    <SolanaActionsBlock
      isConnected
      canSignMessage={canSignMessage}
      canSignTransaction={canSignTransaction}
      canSendTransaction={false}
      onSignMessage={handleSignMessage}
      onSignTransaction={handleSignTransaction}
      onSendTransaction={async () => undefined}
      result={result}
      error={error}
      onClearResult={onClearResult}
    />
  );
}

function ConnectedSolanaActionsWithSend({
  account,
  addInfo,
  onResult,
  onError,
  onClearResult,
  result,
  error,
}: ConnectedSolanaActionsProps) {
  const { chain, rpc } = useSolanaChain();
  const signMessage = useSignMessage(account);
  const transactionSigner = useWalletAccountTransactionSigner(account, chain);
  const sendingSigner = useWalletAccountTransactionSendingSigner(
    account,
    chain,
  );

  const canSignMessage = account.features.includes("solana:signMessage");
  const canSignTransaction = account.features.includes(
    "solana:signTransaction",
  );
  const canSendTransaction = account.features.includes(
    "solana:signAndSendTransaction",
  );

  const handleSignMessage = useSignMessageHandler({
    signMessage,
    addInfo,
    onResult,
    onError,
    onClearResult,
  });

  const handleSignTransaction = useSignTransactionHandler({
    rpc,
    chain,
    transactionSigner,
    addInfo,
    onResult,
    onError,
    onClearResult,
  });

  const handleSendTransaction = useSendTransactionHandler({
    rpc,
    chain,
    sendingSigner,
    addInfo,
    onResult,
    onError,
    onClearResult,
  });

  return (
    <SolanaActionsBlock
      isConnected
      canSignMessage={canSignMessage}
      canSignTransaction={canSignTransaction}
      canSendTransaction={canSendTransaction}
      onSignMessage={handleSignMessage}
      onSignTransaction={handleSignTransaction}
      onSendTransaction={handleSendTransaction}
      result={result}
      error={error}
      onClearResult={onClearResult}
    />
  );
}

function useSignMessageHandler({
  signMessage,
  addInfo,
  onResult,
  onError,
  onClearResult,
}: {
  signMessage: ReturnType<typeof useSignMessage>;
} & SolanaActionsCallbacks) {
  return useCallback(
    async (message: string) => {
      onClearResult();
      try {
        addInfo("signMessage", message);
        const { signature } = await signMessage({
          message: new TextEncoder().encode(message),
        });
        onResult(getBase58Decoder().decode(signature));
      } catch (err) {
        onError((err as Error)?.message ?? String(err));
      }
    },
    [signMessage, addInfo, onResult, onError, onClearResult],
  );
}

function useSignTransactionHandler({
  rpc,
  chain,
  transactionSigner,
  addInfo,
  onResult,
  onError,
  onClearResult,
}: {
  rpc: SolanaRpc;
  chain: SolanaChain;
  transactionSigner: TransactionSigner;
} & SolanaActionsCallbacks) {
  return useCallback(
    async (values: SolanaTransferValues) => {
      onClearResult();
      try {
        addInfo("signTransaction (transfer SOL)", values);
        const message = await buildTransferMessage(
          rpc,
          chain,
          transactionSigner,
          values,
        );
        const signedTransaction =
          await signTransactionMessageWithSigners(message);
        onResult(getBase64EncodedWireTransaction(signedTransaction));
      } catch (err) {
        onError((err as Error)?.message ?? String(err));
      }
    },
    [rpc, chain, transactionSigner, addInfo, onResult, onError, onClearResult],
  );
}

function useSendTransactionHandler({
  rpc,
  chain,
  sendingSigner,
  addInfo,
  onResult,
  onError,
  onClearResult,
}: {
  rpc: SolanaRpc;
  chain: SolanaChain;
  sendingSigner: TransactionSigner;
} & SolanaActionsCallbacks) {
  return useCallback(
    async (values: SolanaTransferValues) => {
      onClearResult();
      try {
        addInfo("sendTransaction (transfer SOL)", values);
        const message = await buildTransferMessage(
          rpc,
          chain,
          sendingSigner,
          values,
        );
        const signature =
          await signAndSendTransactionMessageWithSigners(message);
        onResult(getBase58Decoder().decode(signature));
      } catch (err) {
        onError((err as Error)?.message ?? String(err));
      }
    },
    [rpc, chain, sendingSigner, addInfo, onResult, onError, onClearResult],
  );
}

async function buildTransferMessage(
  rpc: SolanaRpc,
  chain: SolanaChain,
  feePayer: TransactionSigner,
  { recipient, lamports: amount }: SolanaTransferValues,
) {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  return pipe(
    createTransactionMessage({ version: 0 }),
    (message) => setTransactionMessageFeePayerSigner(feePayer, message),
    (message) =>
      setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
    (message) =>
      appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: feePayer,
          destination: address(recipient),
          amount: BigInt(amount),
        }),
        message,
      ),
  );
}
