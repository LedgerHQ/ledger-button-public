"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";
import { Copy } from "@ledgerhq/lumen-ui-react/symbols";
import { address, lamports } from "@solana/kit";
import { useSelectedWalletAccount } from "@solana/react";

import { useSolanaChain } from "./solanaChainContext";
import { type SolanaCluster } from "./solanaCluster";

const LAMPORTS_PER_SOL = 1_000_000_000n;

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
  const [selectedAccount] = useSelectedWalletAccount();
  const { rpc } = useSolanaChain();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedAccount) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    rpc
      .getBalance(address(selectedAccount.address))
      .send()
      .then(({ value }) => {
        if (!cancelled) {
          const sol = Number(value) / Number(lamports(LAMPORTS_PER_SOL));
          setBalance(sol);
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
  }, [selectedAccount, rpc]);

  if (!selectedAccount) {
    return (
      <div className="border border-dashed border-muted rounded-lg p-20 bg-canvas">
        <div className="flex items-center gap-10 mb-12">
          <div className="size-10 rounded-full bg-muted" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Status
          </span>
        </div>
        <p className="body-2 text-muted">
          No Solana wallet connected. Connect one from the list to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-active rounded-lg p-20 bg-canvas">
      <div className="flex items-center justify-between mb-14">
        <div className="flex items-center gap-10">
          <div className="size-10 rounded-full bg-success" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Connected
          </span>
        </div>
        <Tag appearance="success" size="sm" label="Active" />
      </div>

      {selectedAccount.label && (
        <div className="flex items-center gap-12 mb-14">
          {selectedAccount.icon && (
            // eslint-disable-next-line @next/next/no-img-element -- wallet icons are base64 data URLs
            <img
              src={selectedAccount.icon}
              alt={selectedAccount.label}
              className="size-36 rounded-lg"
            />
          )}
          <span className="body-2-semi-bold text-base truncate">
            {selectedAccount.label}
          </span>
        </div>
      )}

      <CopyableValue label="Cluster" value={cluster} />

      <CopyableValue label="Public Key" value={selectedAccount.address} />

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
