"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import {
  ArrowUpRight,
  CreditCard,
  MessageChat,
  Signature,
} from "@ledgerhq/lumen-ui-react/symbols";

import {
  SignSolanaMessageModal,
  SolanaTransferModal,
  type SolanaTransferValues,
} from "./modals";

type ModalType = "sign-message" | "sign-tx" | "send-tx" | null;

interface SolanaActionsBlockProps {
  isConnected: boolean;
  canSignMessage: boolean;
  canSignTransaction: boolean;
  onSignMessage: (message: string) => Promise<void>;
  onSignTransaction: (values: SolanaTransferValues) => Promise<void>;
  onSendTransaction: (values: SolanaTransferValues) => Promise<void>;
  result: string | null;
  error: string | null;
  onClearResult: () => void;
}

const MODAL_TITLES: Record<NonNullable<ModalType>, string> = {
  "sign-message": "Sign Message",
  "sign-tx": "Sign Transaction (SOL transfer)",
  "send-tx": "Send Transaction (SOL transfer)",
};

interface ActionButton {
  type: NonNullable<ModalType>;
  icon: ReactNode;
  label: string;
}

const ACTIONS: ActionButton[] = [
  {
    type: "sign-message",
    icon: <MessageChat size={24} />,
    label: "Sign Message",
  },
  { type: "sign-tx", icon: <Signature size={24} />, label: "Sign TX" },
  { type: "send-tx", icon: <ArrowUpRight size={24} />, label: "Send TX" },
];

export function SolanaActionsBlock({
  isConnected,
  canSignMessage,
  canSignTransaction,
  onSignMessage,
  onSignTransaction,
  onSendTransaction,
  result,
  error,
  onClearResult,
}: SolanaActionsBlockProps) {
  const [modalType, setModalType] = useState<ModalType>(null);

  const isModalOpen = modalType !== null;

  const openModal = useCallback(
    (type: ModalType) => {
      onClearResult();
      setModalType(type);
    },
    [onClearResult],
  );

  const closeModal = useCallback(() => {
    setModalType(null);
  }, []);

  const modalContent = useMemo(() => {
    const modals: Record<NonNullable<ModalType>, ReactNode> = {
      "sign-message": (
        <SignSolanaMessageModal
          onSubmit={onSignMessage}
          onClose={closeModal}
        />
      ),
      "sign-tx": (
        <SolanaTransferModal
          submitLabel="Sign Transaction"
          onSubmit={onSignTransaction}
          onClose={closeModal}
        />
      ),
      "send-tx": (
        <SolanaTransferModal
          submitLabel="Send Transaction"
          onSubmit={onSendTransaction}
          onClose={closeModal}
        />
      ),
    };

    return modalType ? modals[modalType] : null;
  }, [modalType, closeModal, onSignMessage, onSignTransaction, onSendTransaction]);

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="text-center p-20 bg-muted rounded-lg border border-dashed border-muted">
          <p className="body-2 text-muted">
            Connect a Solana wallet to access signing features.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-20">
        <div className="space-y-10">
          <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
            Solana Actions
          </h4>
          <div className="grid grid-cols-3 gap-10">
            {ACTIONS.map((action) => {
              const disabled =
                action.type === "sign-message"
                  ? !canSignMessage
                  : action.type === "sign-tx"
                    ? !canSignTransaction
                    : false;
              return (
                <button
                  key={action.type}
                  disabled={disabled}
                  className="flex flex-col items-center p-16 bg-muted rounded-lg border border-muted hover:border-base hover:bg-muted-transparent transition-all cursor-pointer hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  onClick={() => openModal(action.type)}
                  title={
                    disabled
                      ? "This wallet does not support this method"
                      : undefined
                  }
                >
                  <span className="mb-6 text-muted">{action.icon}</span>
                  <span className="body-2-semi-bold text-base text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {(result || error) && (
          <div className="pt-16 border-t border-muted space-y-10">
            <div className="flex justify-between items-center">
              <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
                Last Result
              </h4>
              <Button appearance="gray" size="sm" onClick={onClearResult}>
                Clear
              </Button>
            </div>
            {result && (
              <div className="p-12 bg-success-transparent border border-success rounded-lg break-all">
                <code className="body-4 font-mono text-base">{result}</code>
              </div>
            )}
            {error && (
              <div className="p-12 bg-error-transparent border border-error rounded-lg break-all">
                <code className="body-4 font-mono text-error">{error}</code>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-muted rounded-lg overflow-hidden">
      <div className="px-24 py-16 bg-muted">
        <h3 className="flex items-center gap-10 body-2-semi-bold text-base">
          <CreditCard size={20} />
          Transactions & Signing
        </h3>
      </div>

      <div className="p-24 bg-canvas">{renderContent()}</div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader
            appearance="compact"
            title={modalType ? MODAL_TITLES[modalType] : ""}
            onClose={closeModal}
          />
          <DialogBody>{modalContent}</DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
