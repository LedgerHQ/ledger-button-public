"use client";

import { useCallback } from "react";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import { Link, Search } from "@ledgerhq/lumen-ui-react/symbols";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet,type Wallet } from "@solana/wallet-adapter-react";

import { cn } from "../../lib/utils";

interface WalletSelectionBlockProps {
  onLog: (label: string, data?: unknown) => void;
  onError: (message: string) => void;
}

const READY_STATE_LABEL: Record<WalletReadyState, string> = {
  [WalletReadyState.Installed]: "Installed",
  [WalletReadyState.Loadable]: "Loadable",
  [WalletReadyState.NotDetected]: "Not detected",
  [WalletReadyState.Unsupported]: "Unsupported",
};

export function WalletSelectionBlock({
  onLog,
  onError,
}: WalletSelectionBlockProps) {
  const {
    wallets,
    wallet: selectedWallet,
    publicKey,
    connecting,
    connected,
    select,
    connect,
    disconnect,
  } = useWallet();

  const handleSelect = useCallback(
    async (target: Wallet) => {
      onLog(`Selecting ${target.adapter.name}`);
      select(target.adapter.name);
    },
    [select, onLog],
  );

  const handleConnect = useCallback(async () => {
    if (!selectedWallet) return;
    try {
      onLog(`Connecting to ${selectedWallet.adapter.name}…`);
      await connect();
    } catch (err) {
      onError((err as Error)?.message ?? String(err));
    }
  }, [selectedWallet, connect, onLog, onError]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      onLog("Disconnected");
    } catch (err) {
      onError((err as Error)?.message ?? String(err));
    }
  }, [disconnect, onLog, onError]);

  const sortedWallets = [...wallets].sort((a, b) => {
    const order = (w: Wallet) =>
      w.readyState === WalletReadyState.Installed
        ? 0
        : w.readyState === WalletReadyState.Loadable
          ? 1
          : 2;
    return order(a) - order(b);
  });

  return (
    <div className="border border-muted rounded-lg overflow-hidden">
      <div className="px-24 py-16 bg-muted">
        <h3 className="flex items-center gap-10 body-2-semi-bold text-base">
          <Link size={20} />
          Solana Wallet Standard
        </h3>
      </div>

      <div className="p-24 bg-canvas space-y-20">
        <div className="flex items-center gap-12">
          <Button
            appearance="accent"
            size="md"
            onClick={handleConnect}
            disabled={!selectedWallet || connected || connecting}
          >
            <Search size={16} />
            {connecting ? "Connecting…" : "Connect"}
          </Button>
          {connected && (
            <Button appearance="red" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          )}
        </div>

        {sortedWallets.length > 0 ? (
          <div className="space-y-12">
            <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
              Detected Wallets ({sortedWallets.length})
            </h4>
            <div className="space-y-10">
              {sortedWallets.map((target) => {
                const isSelected =
                  selectedWallet?.adapter.name === target.adapter.name;
                const isConnected = isSelected && publicKey !== null;

                return (
                  <div
                    key={target.adapter.name}
                    className={cn(
                      "flex justify-between items-center px-16 py-14 border rounded-lg cursor-pointer transition-colors",
                      isSelected
                        ? "border-active bg-muted-transparent"
                        : "border-muted hover:border-base hover:bg-muted-transparent",
                    )}
                    onClick={() => handleSelect(target)}
                  >
                    <div className="flex items-center gap-12">
                      {/* eslint-disable-next-line @next/next/no-img-element -- adapter icons are base64 data URLs */}
                      <img
                        src={target.adapter.icon}
                        alt={target.adapter.name}
                        className="size-36 rounded-lg"
                      />
                      <div className="flex flex-col gap-2">
                        <span className="body-2-semi-bold text-base">
                          {target.adapter.name}
                        </span>
                        <span className="body-4 text-muted font-mono">
                          {READY_STATE_LABEL[target.readyState]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {isConnected && (
                        <Tag
                          appearance="success"
                          size="sm"
                          label="Connected"
                        />
                      )}
                      {isSelected && !isConnected && (
                        <Tag appearance="gray" size="sm" label="Selected" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center p-20 bg-muted rounded-lg border border-dashed border-muted">
            <p className="body-2 text-muted">
              No Solana wallets detected. Install a Wallet-Standard wallet
              (MetaMask with the Solana Snap, Phantom, Backpack, Solflare, …)
              and refresh.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
