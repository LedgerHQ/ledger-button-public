"use client";

import type { EIP6963ProviderDetail } from "@ledgerhq/ledger-wallet-provider";
import { Tag } from "@ledgerhq/lumen-ui-react";

interface ConnectionStatusProps {
  selectedProvider: EIP6963ProviderDetail | null;
  account: string | null;
  chainId: string | null;
  isInitialized: boolean;
}

export function ConnectionStatus({
  selectedProvider,
  account,
  chainId,
  isInitialized,
}: ConnectionStatusProps) {
  if (!isInitialized) {
    return (
      <div className="border border-muted rounded-lg p-20 bg-canvas">
        <div className="flex items-center gap-10 mb-12">
          <div className="size-10 rounded-full bg-warning animate-pulse" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Status
          </span>
        </div>
        <p className="body-2 text-muted">Initializing provider…</p>
      </div>
    );
  }

  if (!selectedProvider) {
    return (
      <div className="border border-dashed border-muted rounded-lg p-20 bg-canvas">
        <div className="flex items-center gap-10 mb-12">
          <div className="size-10 rounded-full bg-muted" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Status
          </span>
        </div>
        <p className="body-2 text-muted">
          No provider connected. Discover and select a provider to begin
          testing.
        </p>
      </div>
    );
  }

  const isConnected = account !== null;

  return (
    <div className="border border-active rounded-lg p-20 bg-canvas">
      <div className="flex items-center justify-between mb-14">
        <div className="flex items-center gap-10">
          <div className="size-10 rounded-full bg-success" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Connected
          </span>
        </div>
        <Tag
          appearance={isConnected ? "success" : "gray"}
          size="sm"
          label={isConnected ? "Active" : "No Account"}
        />
      </div>

      <div className="flex items-center gap-12 mb-14">
        {/* eslint-disable-next-line @next/next/no-img-element -- provider icons are base64 data URLs */}
        <img
          src={selectedProvider.info.icon}
          alt={selectedProvider.info.name}
          className="size-36 rounded-lg"
        />
        <div className="flex flex-col gap-2 min-w-0">
          <span className="body-2-semi-bold text-base truncate">
            {selectedProvider.info.name}
          </span>
          <span className="body-2 text-muted font-mono truncate">
            {selectedProvider.info.rdns ||
              selectedProvider.info.uuid.slice(0, 12)}
          </span>
        </div>
      </div>

      {account && (
        <div className="pt-14 border-t border-muted">
          <span className="body-2 text-muted block mb-4">Account</span>
          <span className="body-2-semi-bold text-base font-mono break-all">
            {account.slice(0, 6)}…{account.slice(-4)}
          </span>
        </div>
      )}

      {chainId && (
        <div className="pt-14 border-t border-muted">
          <span className="body-2 text-muted block mb-4">Chain ID</span>
          <span className="body-2-semi-bold text-base font-mono">
            {chainId}
          </span>
        </div>
      )}
    </div>
  );
}