"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";
import { Copy } from "@ledgerhq/lumen-ui-react/symbols";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { type SolanaCluster } from "./solanaCluster";

function CopyableValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <div className="pt-14 border-t border-muted">
      <span className="body-2 text-muted block mb-4">{label}</span>
      <div className="flex items-start justify-between gap-8">
        <span className="body-2-semi-bold text-base font-mono break-all">
          {value}
        </span>
        <button
          onClick={handleCopy}
          className="text-muted hover:text-base transition-colors cursor-pointer shrink-0 mt-2"
          title={`Copy ${label.toLowerCase()}`}
        >
          {copied ? (
            <span className="body-4 text-success">Copied!</span>
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

interface SolanaConnectionStatusProps {
  cluster: SolanaCluster;
}

export function SolanaConnectionStatus({
  cluster,
}: SolanaConnectionStatusProps) {
  const { wallet, publicKey, connected, connecting } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    connection
      .getBalance(publicKey)
      .then((lamports) => {
        if (!cancelled) {
          setBalance(lamports / LAMPORTS_PER_SOL);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBalance(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  if (connecting) {
    return (
      <div className="border border-muted rounded-lg p-20 bg-canvas">
        <div className="flex items-center gap-10 mb-12">
          <div className="size-10 rounded-full bg-warning animate-pulse" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Status
          </span>
        </div>
        <p className="body-2 text-muted">Connecting to wallet…</p>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="border border-dashed border-muted rounded-lg p-20 bg-canvas">
        <div className="flex items-center gap-10 mb-12">
          <div className="size-10 rounded-full bg-muted" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Status
          </span>
        </div>
        <p className="body-2 text-muted">
          No Solana wallet selected. Pick one from the list to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-active rounded-lg p-20 bg-canvas">
      <div className="flex items-center justify-between mb-14">
        <div className="flex items-center gap-10">
          <div
            className={
              connected
                ? "size-10 rounded-full bg-success"
                : "size-10 rounded-full bg-muted"
            }
          />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            {connected ? "Connected" : "Selected"}
          </span>
        </div>
        <Tag
          appearance={connected ? "success" : "gray"}
          size="sm"
          label={connected ? "Active" : "Not Connected"}
        />
      </div>

      <div className="flex items-center gap-12 mb-14">
        {/* eslint-disable-next-line @next/next/no-img-element -- adapter icons are base64 data URLs */}
        <img
          src={wallet.adapter.icon}
          alt={wallet.adapter.name}
          className="size-36 rounded-lg"
        />
        <div className="flex flex-col gap-2 min-w-0">
          <span className="body-2-semi-bold text-base truncate">
            {wallet.adapter.name}
          </span>
          <span className="body-2 text-muted font-mono truncate">
            {wallet.readyState}
          </span>
        </div>
      </div>

      <CopyableValue label="Cluster" value={cluster} />

      {publicKey && (
        <CopyableValue label="Public Key" value={publicKey.toBase58()} />
      )}

      {balance !== null && (
        <div className="pt-14 border-t border-muted">
          <span className="body-2 text-muted block mb-4">Balance</span>
          <span className="body-2-semi-bold text-base font-mono">
            {balance.toFixed(6)} SOL
          </span>
        </div>
      )}
    </div>
  );
}
