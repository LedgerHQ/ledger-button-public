"use client";

import { useState } from "react";

import blockStyles from "./Block.module.css";
import styles from "./QuickActionsBlock.module.css";

interface QuickActionsBlockProps {
  isConnected: boolean;
  hasAccount: boolean;
  onOpenHome: () => void;
  onOpenSettings: () => void;
  onRequestAccounts: () => void;
}

export function QuickActionsBlock({
  isConnected,
  hasAccount,
  onOpenHome,
  onOpenSettings,
  onRequestAccounts,
}: QuickActionsBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={blockStyles.block}>
      <div
        className={blockStyles["block__header"]}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className={blockStyles["block__title"]}>
          <span className={blockStyles["block__icon"]}>⚡</span>
          Quick Screen Access
        </h3>
        <span className={blockStyles["block__toggle"]}>{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className={blockStyles["block__content"]}>
          <p className={blockStyles["block__description"]}>
            Quick access to Ledger app screens and account actions.
          </p>

          {!isConnected ? (
            <div className={blockStyles["block__empty-state"]}>
              <p>Connect to a provider first.</p>
            </div>
          ) : (
            <>
              <div className={blockStyles["block__section"]}>
                <h4 className={blockStyles["block__subtitle"]}>Navigation</h4>
                <div className={`${blockStyles["block__button-grid"]} ${blockStyles["block__button-grid--wide"]}`}>
                  <button
                    className={styles["quick-actions__button"]}
                    onClick={onOpenHome}
                    disabled={!hasAccount}
                  >
                    <span className={styles["quick-actions__button-icon"]}>🏠</span>
                    <span className={styles["quick-actions__button-label"]}>Home</span>
                    <span className={styles["quick-actions__button-hint"]}>Open Ledger home screen</span>
                  </button>

                  <button
                    className={styles["quick-actions__button"]}
                    onClick={onOpenSettings}
                  >
                    <span className={styles["quick-actions__button-icon"]}>⚙️</span>
                    <span className={styles["quick-actions__button-label"]}>Settings</span>
                    <span className={styles["quick-actions__button-hint"]}>Open Ledger settings</span>
                  </button>
                </div>
              </div>

              {!hasAccount && (
                <div className={blockStyles["block__section"]}>
                  <h4 className={blockStyles["block__subtitle"]}>Account</h4>
                  <div className={`${blockStyles["block__button-grid"]} ${blockStyles["block__button-grid--wide"]}`}>
                    <button
                      className={`${styles["quick-actions__button"]} ${styles["quick-actions__button--primary"]}`}
                      onClick={onRequestAccounts}
                    >
                      <span className={styles["quick-actions__button-icon"]}>👛</span>
                      <span className={styles["quick-actions__button-label"]}>Request Accounts</span>
                      <span className={styles["quick-actions__button-hint"]}>Connect your wallet</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
