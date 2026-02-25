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
  Clip,
  CreditCard,
  DocumentCode,
  MessageChat,
  Signature,
  Tools,
} from "@ledgerhq/lumen-ui-react/symbols";

import {
  ProviderRequestModal,
  SendTransactionModal,
  SignPersonalMessageModal,
  SignRawTransactionModal,
  SignTransactionModal,
  SignTypedDataModal,
} from "./modals";

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

const MODAL_TITLES: Record<NonNullable<ModalType>, string> = {
  "sign-tx": "Sign Transaction",
  "send-tx": "Send Transaction",
  "sign-raw-tx": "Sign Raw Transaction",
  "sign-typed-data": "Sign Typed Data (EIP-712)",
  "sign-personal-message": "Sign Personal Message",
  "provider-request": "Provider Request",
};

interface ActionButton {
  type: NonNullable<ModalType>;
  icon: ReactNode;
  label: string;
  group: "tx" | "msg";
}

const ACTIONS: ActionButton[] = [
  { type: "sign-tx", icon: <Signature size={24} />, label: "Sign TX", group: "tx" },
  { type: "send-tx", icon: <ArrowUpRight size={24} />, label: "Send TX", group: "tx" },
  { type: "sign-raw-tx", icon: <DocumentCode size={24} />, label: "Sign Raw TX", group: "tx" },
  { type: "sign-typed-data", icon: <Clip size={24} />, label: "Typed Data", group: "msg" },
  {
    type: "sign-personal-message",
    icon: <MessageChat size={24} />,
    label: "Personal Msg",
    group: "msg",
  },
  { type: "provider-request", icon: <Tools size={24} />, label: "RPC Request", group: "msg" },
];

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
      "sign-tx": (
        <SignTransactionModal onSubmit={onSignTransaction} onClose={closeModal} />
      ),
      "send-tx": (
        <SendTransactionModal onSubmit={onSendTransaction} onClose={closeModal} />
      ),
      "sign-raw-tx": (
        <SignRawTransactionModal
          onSubmit={onSignRawTransaction}
          onClose={closeModal}
        />
      ),
      "sign-typed-data": (
        <SignTypedDataModal onSubmit={onSignTypedData} onClose={closeModal} />
      ),
      "sign-personal-message": (
        <SignPersonalMessageModal
          onSubmit={onSignPersonalMessage}
          onClose={closeModal}
        />
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

  const txActions = ACTIONS.filter((a) => a.group === "tx");
  const msgActions = ACTIONS.filter((a) => a.group === "msg");

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="text-center p-20 bg-muted rounded-lg border border-dashed border-muted">
            <p className="body-2 text-muted">
              Connect to a provider to access transaction features.
            </p>
        </div>
      );
    }

    if (!hasAccount) {
      return (
        <div className="text-center p-20 bg-muted rounded-lg border border-dashed border-muted">
            <p className="body-2 text-muted">
              Request an account to access transaction features.
            </p>
        </div>
      );
    }

    return (
      <div className="space-y-20">
        <div className="space-y-10">
          <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
            Transactions
          </h4>
          <div className="grid grid-cols-3 gap-10">
            {txActions.map((action) => (
              <button
                key={action.type}
                className="flex flex-col items-center p-16 bg-muted rounded-lg border border-muted hover:border-base hover:bg-muted-transparent transition-all cursor-pointer hover:-translate-y-px"
                onClick={() => openModal(action.type)}
              >
                <span className="mb-6 text-muted">{action.icon}</span>
                <span className="body-2-semi-bold text-base text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
            Messages & Data
          </h4>
          <div className="grid grid-cols-3 gap-10">
            {msgActions.map((action) => (
              <button
                key={action.type}
                className="flex flex-col items-center p-16 bg-muted rounded-lg border border-muted hover:border-base hover:bg-muted-transparent transition-all cursor-pointer hover:-translate-y-px"
                onClick={() => openModal(action.type)}
              >
                <span className="mb-6 text-muted">{action.icon}</span>
                <span className="body-2-semi-bold text-base text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
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
                <code className="body-4 font-mono text-base">
                  {result}
                </code>
              </div>
            )}
            {error && (
              <div className="p-12 bg-error-transparent border border-error rounded-lg break-all">
                <code className="body-4 font-mono text-error">
                  {error}
                </code>
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