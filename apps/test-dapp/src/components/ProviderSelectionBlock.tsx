"use client";

import { useCallback, useState } from "react";
import type { EIP6963ProviderDetail } from "@ledgerhq/ledger-wallet-provider";

import blockStyles from "./Block.module.css";
import styles from "./ProviderSelectionBlock.module.css";

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
  const [isExpanded, setIsExpanded] = useState(true);

  const handleProviderClick = useCallback(
    (provider: EIP6963ProviderDetail) => {
      onSelectProvider(provider);
    },
    [onSelectProvider]
  );

  return (
    <div className={blockStyles.block}>
      <div
        className={blockStyles["block__header"]}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className={blockStyles["block__title"]}>
          <span className={blockStyles["block__icon"]}>🔌</span>
          EIP-6963 Provider Selection
        </h3>
        <span className={blockStyles["block__toggle"]}>{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className={blockStyles["block__content"]}>
          <p className={blockStyles["block__description"]}>
            Select a wallet provider using the EIP-6963 Multi Injected Provider Discovery standard.
          </p>

          <div className={blockStyles["block__actions"]}>
            <button
              className={styles["provider-selection__discover-button"]}
              onClick={onRequestProviders}
            >
              🔍 Discover Providers
            </button>
          </div>

          {providers.length > 0 && (
            <div className={styles["provider-selection__list"]}>
              <h4 className={styles["provider-selection__subtitle"]}>
                Available Providers ({providers.length})
              </h4>
              {providers.map((provider) => {
                const isSelected = selectedProvider?.info.uuid === provider.info.uuid;
                const isConnected = isSelected && account !== null;

                return (
                  <div
                    key={provider.info.uuid}
                    className={`${styles["provider-selection__card"]} ${isSelected ? styles["provider-selection__card--selected"] : ""}`}
                    onClick={() => handleProviderClick(provider)}
                  >
                    <div className={styles["provider-selection__card-info"]}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- provider icons are base64 data URLs */}
                      <img
                        src={provider.info.icon}
                        alt={provider.info.name}
                        className={styles["provider-selection__card-icon"]}
                      />
                      <div className={styles["provider-selection__card-details"]}>
                        <span className={styles["provider-selection__card-name"]}>
                          {provider.info.name}
                        </span>
                        <span className={styles["provider-selection__card-rdns"]}>
                          {provider.info.rdns || provider.info.uuid.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <div className={styles["provider-selection__card-status"]}>
                      {isConnected && (
                        <span className={styles["provider-selection__connected-badge"]}>
                          Connected
                        </span>
                      )}
                      {isSelected && !isConnected && (
                        <span className={styles["provider-selection__selected-badge"]}>
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {providers.length === 0 && (
            <div className={blockStyles["block__empty-state"]}>
              <p>No providers discovered yet.</p>
              <p className={blockStyles["block__hint"]}>
                Click &quot;Discover Providers&quot; to find available wallet extensions.
              </p>
            </div>
          )}

          {selectedProvider && (
            <div className={styles["provider-selection__selected-info"]}>
              <h4 className={styles["provider-selection__subtitle"]}>Selected Provider</h4>
              <div className={styles["provider-selection__selected-card"]}>
                {/* eslint-disable-next-line @next/next/no-img-element -- provider icons are base64 data URLs */}
                <img
                  src={selectedProvider.info.icon}
                  alt={selectedProvider.info.name}
                  className={styles["provider-selection__selected-icon"]}
                />
                <div className={styles["provider-selection__selected-details"]}>
                  <span className={styles["provider-selection__selected-name"]}>
                    {selectedProvider.info.name}
                  </span>
                  {account && (
                    <span className={styles["provider-selection__account-address"]}>
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                  )}
                </div>
                <button
                  className={styles["provider-selection__disconnect-button"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDisconnect();
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
