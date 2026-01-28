"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";

import {
  ProviderRequestModal,
  SendTransactionModal,
  SignPersonalMessageModal,
  SignRawTransactionModal,
  SignTransactionModal,
  SignTypedDataModal,
} from "./modals";

import blockStyles from "./Block.module.css";
import styles from "./TransactionsBlock.module.css";

type ModalType =
  | "sign-tx"
  | "send-tx"
  | "sign-raw-tx"
  | "sign-typed-data"
  | "sign-personal-message"
  | "provider-request"
  | null;

interface TransactionsBlockProps {
  isConnected: boolean;
  hasAccount: boolean;
  account: string | null;
  onSignTransaction: (tx: string) => Promise<void>;
  onSendTransaction: (tx: string) => Promise<void>;
  onSignRawTransaction: (rawTx: string) => Promise<void>;
  onSignTypedData: (typedData: string) => Promise<void>;
  onSignPersonalMessage: (message: string) => Promise<void>;
  onProviderRequest: (method: string, params: string) => Promise<void>;
  result: string | null;
  error: string | null;
  onClearResult: () => void;
}

export function TransactionsBlock({
  isConnected,
  hasAccount,
  onSignTransaction,
  onSendTransaction,
  onSignRawTransaction,
  onSignTypedData,
  onSignPersonalMessage,
  onProviderRequest,
  result,
  error,
  onClearResult,
}: TransactionsBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);

  const isModalOpen = modalType !== null;

  const openModal = useCallback(
    (type: ModalType) => {
      onClearResult();
      setModalType(type);
    },
    [onClearResult]
  );

  const closeModal = useCallback(() => {
    setModalType(null);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const modalContent = useMemo(() => {
    const modals: Record<NonNullable<ModalType>, ReactNode> = {
      "sign-tx": (
        <SignTransactionModal onSubmit={onSignTransaction} onClose={closeModal} />
      ),
      "send-tx": (
        <SendTransactionModal onSubmit={onSendTransaction} onClose={closeModal} />
      ),
      "sign-raw-tx": (
        <SignRawTransactionModal onSubmit={onSignRawTransaction} onClose={closeModal} />
      ),
      "sign-typed-data": (
        <SignTypedDataModal onSubmit={onSignTypedData} onClose={closeModal} />
      ),
      "sign-personal-message": (
        <SignPersonalMessageModal onSubmit={onSignPersonalMessage} onClose={closeModal} />
      ),
      "provider-request": (
        <ProviderRequestModal onSubmit={onProviderRequest} onClose={closeModal} />
      ),
    };

    return modalType ? modals[modalType] : null;
  }, [
    modalType,
    closeModal,
    onSignTransaction,
    onSendTransaction,
    onSignRawTransaction,
    onSignTypedData,
    onSignPersonalMessage,
    onProviderRequest,
  ]);

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className={blockStyles["block__empty-state"]}>
          <p>Connect to a provider first.</p>
        </div>
      );
    }

    if (!hasAccount) {
      return (
        <div className={blockStyles["block__empty-state"]}>
          <p>Request an account to access transaction features.</p>
        </div>
      );
    }

    return (
      <>
        <div className={blockStyles["block__section"]}>
          <h4 className={blockStyles["block__subtitle"]}>Transactions</h4>
          <div className={blockStyles["block__button-grid"]}>
            <button
              className={styles["transactions__button"]}
              onClick={() => openModal("sign-tx")}
            >
              <span className={styles["transactions__button-icon"]}>✍️</span>
              <span className={styles["transactions__button-label"]}>Sign Transaction</span>
            </button>
            <button
              className={styles["transactions__button"]}
              onClick={() => openModal("send-tx")}
            >
              <span className={styles["transactions__button-icon"]}>📤</span>
              <span className={styles["transactions__button-label"]}>Send Transaction</span>
            </button>
            <button
              className={styles["transactions__button"]}
              onClick={() => openModal("sign-raw-tx")}
            >
              <span className={styles["transactions__button-icon"]}>📝</span>
              <span className={styles["transactions__button-label"]}>Sign Raw TX</span>
            </button>
          </div>
        </div>

        <div className={blockStyles["block__section"]}>
          <h4 className={blockStyles["block__subtitle"]}>Messages & Data</h4>
          <div className={blockStyles["block__button-grid"]}>
            <button
              className={styles["transactions__button"]}
              onClick={() => openModal("sign-typed-data")}
            >
              <span className={styles["transactions__button-icon"]}>📋</span>
              <span className={styles["transactions__button-label"]}>Sign Typed Data</span>
            </button>
            <button
              className={styles["transactions__button"]}
              onClick={() => openModal("sign-personal-message")}
            >
              <span className={styles["transactions__button-icon"]}>💬</span>
              <span className={styles["transactions__button-label"]}>Personal Message</span>
            </button>
            <button
              className={styles["transactions__button"]}
              onClick={() => openModal("provider-request")}
            >
              <span className={styles["transactions__button-icon"]}>🔧</span>
              <span className={styles["transactions__button-label"]}>Provider Request</span>
            </button>
          </div>
        </div>

        {(result || error) && (
          <div className={styles["transactions__result-section"]}>
            <div className={styles["transactions__result-header"]}>
              <h4 className={blockStyles["block__subtitle"]}>Result</h4>
              <button
                className={styles["transactions__clear-button"]}
                onClick={onClearResult}
              >
                Clear
              </button>
            </div>
            {result && (
              <div className={styles["transactions__result"]}>
                <code>{result}</code>
              </div>
            )}
            {error && (
              <div className={styles["transactions__error"]}>
                <code>{error}</code>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className={blockStyles.block}>
      <div className={blockStyles["block__header"]} onClick={toggleExpanded}>
        <h3 className={blockStyles["block__title"]}>
          <span className={blockStyles["block__icon"]}>💳</span>
          Transactions & Signing
        </h3>
        <span className={blockStyles["block__toggle"]}>{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className={blockStyles["block__content"]}>{renderContent()}</div>
      )}

      <Dialog
        open={isModalOpen}
        as="div"
        className={styles["transactions__dialog"]}
        onClose={closeModal}
      >
        <div className={styles["transactions__dialog-wrapper"]}>
          <div className={styles["transactions__dialog-content"]}>{modalContent}</div>
        </div>
      </Dialog>
    </div>
  );
}