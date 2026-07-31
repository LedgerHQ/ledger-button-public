"use client";

import { useCallback, useMemo } from "react";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import { Link, Search } from "@ledgerhq/lumen-ui-react/symbols";
import { useSelectedWalletAccount } from "@solana/react";
import {
  type UiWallet,
  useConnect,
  useDisconnect,
} from "@wallet-standard/react";

import { cn } from "../../lib/utils";

interface WalletSelectionBlockProps {
  onLog: (label: string, data?: unknown) => void;
  onError: (message: string) => void;
}

export function WalletSelectionBlock({
  onLog,
  onError,
}: WalletSelectionBlockProps) {
  const [, , wallets] = useSelectedWalletAccount();

  // De-duplicate on name: the same wallet can be registered more than once
  // (e.g. re-announced), which would otherwise list it multiple times.
  const uniqueWallets = useMemo(() => {
    const byName = new Map<string, UiWallet>();
    for (const wallet of wallets) {
      if (!byName.has(wallet.name)) {
        byName.set(wallet.name, wallet);
      }
    }
    return [...byName.values()];
  }, [wallets]);

  return (
    <div className="border border-muted rounded-lg overflow-hidden">
      <div className="px-24 py-16 bg-muted">
        <h3 className="flex items-center gap-10 body-2-semi-bold text-base">
          <Link size={20} />
          Solana Wallet Standard
        </h3>
      </div>

      <div className="p-24 bg-canvas space-y-20">
        {uniqueWallets.length > 0 ? (
          <div className="space-y-12">
            <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
              Detected Wallets ({uniqueWallets.length})
            </h4>
            <div className="space-y-10">
              {uniqueWallets.map((wallet) => (
                <WalletRow
                  key={wallet.name}
                  wallet={wallet}
                  onLog={onLog}
                  onError={onError}
                />
              ))}
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

interface WalletRowProps {
  wallet: UiWallet;
  onLog: (label: string, data?: unknown) => void;
  onError: (message: string) => void;
}

function WalletRow({ wallet, onLog, onError }: WalletRowProps) {
  const [selectedAccount, setSelectedAccount] = useSelectedWalletAccount();
  const [isConnecting, connect] = useConnect(wallet);
  const [isDisconnecting, disconnect] = useDisconnect(wallet);

  const isSelected = Boolean(
    selectedAccount &&
      wallet.accounts.some(
        (account) => account.address === selectedAccount.address,
      ),
  );

  const handleConnect = useCallback(async () => {
    try {
      onLog(`Connecting to ${wallet.name}…`);
      const accounts = await connect();
      const account = accounts[0];
      if (account) {
        setSelectedAccount(account);
        onLog(`Connected ${wallet.name}`, account.address);
      } else {
        onError("Wallet returned no accounts");
      }
    } catch (err) {
      onError((err as Error)?.message ?? String(err));
    }
  }, [wallet, connect, setSelectedAccount, onLog, onError]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setSelectedAccount(undefined);
      onLog(`Disconnected ${wallet.name}`);
    } catch (err) {
      onError((err as Error)?.message ?? String(err));
    }
  }, [wallet, disconnect, setSelectedAccount, onLog, onError]);

  return (
    <div
      className={cn(
        "flex justify-between items-center px-16 py-14 border rounded-lg transition-colors",
        isSelected
          ? "border-active bg-muted-transparent"
          : "border-muted hover:border-base hover:bg-muted-transparent",
      )}
    >
      <div className="flex items-center gap-12">
        {/* eslint-disable-next-line @next/next/no-img-element -- wallet icons are base64 data URLs */}
        <img
          src={wallet.icon}
          alt={wallet.name}
          className="size-36 rounded-lg"
        />
        <div className="flex flex-col gap-2">
          <span className="body-2-semi-bold text-base">{wallet.name}</span>
          {isSelected && (
            <span className="body-4 text-muted font-mono">
              {selectedAccount?.address.slice(0, 8)}…
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-10">
        {isSelected && <Tag appearance="success" size="sm" label="Connected" />}
        {isSelected ? (
          <Button
            appearance="red"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        ) : (
          <Button
            appearance="accent"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            <Search size={16} />
            {isConnecting ? "Connecting…" : "Connect"}
          </Button>
        )}
      </div>
    </div>
  );
}
