"use client";

import { useCallback } from "react";
import type { EIP6963ProviderDetail } from "@ledgerhq/ledger-wallet-provider";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";

import { cn } from "../lib/utils";

interface ProviderSelectionBlockProps {
  providers: EIP6963ProviderDetail[];
  selectedProvider: EIP6963ProviderDetail | null;
  onSelectProvider: (provider: EIP6963ProviderDetail) => void;
  onRequestProviders: () => void;
  onDisconnect: () => void;
  account: string | null;
}

export function ProviderSelectionBlock({
  providers,
  selectedProvider,
  onSelectProvider,
  onRequestProviders,
  onDisconnect,
  account,
}: ProviderSelectionBlockProps) {
  const handleProviderClick = useCallback(
    (provider: EIP6963ProviderDetail) => {
      onSelectProvider(provider);
    },
    [onSelectProvider],
  );

  return (
    <div className="border border-muted rounded-lg overflow-hidden">
      <div className="px-24 py-16 bg-muted">
        <h3 className="flex items-center gap-10 body-2-semi-bold text-base">
          <span>🔌</span>
          EIP-6963 Provider Selection
        </h3>
      </div>

      <div className="p-24 bg-canvas space-y-20">
        <div className="flex items-center gap-12">
          <Button
            appearance="accent"
            size="md"
            onClick={onRequestProviders}
          >
            🔍 Discover Providers
          </Button>
          {selectedProvider && (
            <Button
              appearance="red"
              size="sm"
              onClick={onDisconnect}
            >
              Disconnect
            </Button>
          )}
        </div>

        {providers.length > 0 ? (
          <div className="space-y-12">
            <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
              Available Providers ({providers.length})
            </h4>
            <div className="space-y-10">
              {providers.map((provider) => {
                const isSelected =
                  selectedProvider?.info.uuid === provider.info.uuid;
                const isConnected = isSelected && account !== null;

                return (
                  <div
                    key={provider.info.uuid}
                    className={cn(
                      "flex justify-between items-center px-16 py-14 border rounded-lg cursor-pointer transition-colors",
                      isSelected
                        ? "border-active bg-muted-transparent"
                        : "border-muted hover:border-base hover:bg-muted-transparent",
                    )}
                    onClick={() => handleProviderClick(provider)}
                  >
                    <div className="flex items-center gap-12">
                      {/* eslint-disable-next-line @next/next/no-img-element -- provider icons are base64 data URLs */}
                      <img
                        src={provider.info.icon}
                        alt={provider.info.name}
                        className="size-36 rounded-lg"
                      />
                      <div className="flex flex-col gap-2">
                        <span className="body-2-semi-bold text-base">
                          {provider.info.name}
                        </span>
                        <span className="body-4 text-muted font-mono">
                          {provider.info.rdns ||
                            provider.info.uuid.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {isConnected && (
                        <Tag appearance="success" size="sm" label="Connected" />
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
              No providers discovered yet. Click &quot;Discover Providers&quot;
              to find available wallet extensions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}