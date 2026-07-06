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
  canSendTransaction: boolean;
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
  canSendTransaction,
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
        <SignSolanaMessageModal onSubmit={onSignMessage} onClose={closeModal} />
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
  }, [
    modalType,
    closeModal,
    onSignMessage,
    onSignTransaction,
    onSendTransaction,
  ]);

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="bg-muted border-muted rounded-lg border border-dashed p-20 text-center">
          <p className="body-2 text-muted">
            Connect a Solana wallet to access signing features.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-20">
        <div className="space-y-10">
          <h4 className="body-2-semi-bold text-muted tracking-wider uppercase">
            Solana Actions
          </h4>
          <div className="grid grid-cols-3 gap-10">
            {ACTIONS.map((action) => {
              const disabled =
                action.type === "sign-message"
                  ? !canSignMessage
                  : action.type === "sign-tx"
                    ? !canSignTransaction
                    : !canSendTransaction;
              return (
                <button
                  key={action.type}
                  disabled={disabled}
                  className="bg-muted border-muted hover:border-base hover:bg-muted-transparent flex cursor-pointer flex-col items-center rounded-lg border p-16 transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  onClick={() => openModal(action.type)}
                  title={
                    disabled
                      ? "This wallet does not support this method"
                      : undefined
                  }
                >
                  <span className="text-muted mb-6">{action.icon}</span>
                  <span className="body-2-semi-bold text-center text-base leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {(result || error) && (
          <div className="border-muted space-y-10 border-t pt-16">
            <div className="flex items-center justify-between">
              <h4 className="body-2-semi-bold text-muted tracking-wider uppercase">
                Last Result
              </h4>
              <Button appearance="gray" size="sm" onClick={onClearResult}>
                Clear
              </Button>
            </div>
            {result && (
              <div className="bg-success-transparent border-success rounded-lg border p-12 break-all">
                <code className="body-4 font-mono text-base">{result}</code>
              </div>
            )}
            {error && (
              <div className="bg-error-transparent border-error rounded-lg border p-12 break-all">
                <code className="body-4 text-error font-mono">{error}</code>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-muted overflow-hidden rounded-lg border">
      <div className="bg-muted px-24 py-16">
        <h3 className="body-2-semi-bold flex items-center gap-10 text-base">
          <CreditCard size={20} />
          Transactions & Signing
        </h3>
      </div>

      <div className="bg-canvas p-24">{renderContent()}</div>

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
