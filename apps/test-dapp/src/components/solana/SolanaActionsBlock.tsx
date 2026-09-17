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
  Exchange,
  MessageChat,
  Signature,
} from "@ledgerhq/lumen-ui-react/symbols";

import {
  JupiterSwapModal,
  type JupiterSwapValues,
  SignSolanaMessageModal,
  SolanaTransferModal,
  type SolanaTransferValues,
} from "./modals";

type ModalType =
  | "sign-message"
  | "sign-tx"
  | "send-tx"
  | "jupiter-sign"
  | "jupiter-swap"
  | null;

interface SolanaActionsBlockProps {
  isConnected: boolean;
  canSignMessage: boolean;
  canSignTransaction: boolean;
  canSendTransaction: boolean;
  canJupiterSwap: boolean;
  ownAddress?: string;
  onSignMessage: (message: string) => Promise<void>;
  onSignTransaction: (values: SolanaTransferValues) => Promise<void>;
  onSendTransaction: (values: SolanaTransferValues) => Promise<void>;
  onJupiterSign: (values: JupiterSwapValues) => Promise<void>;
  onJupiterSwap: (values: JupiterSwapValues) => Promise<void>;
  result: string | null;
  error: string | null;
  onClearResult: () => void;
}

// The "Sign TX" flow signs without broadcasting, so it can safely default to a
// real, valid base58 recipient (the connected account's own address) and a
// tiny amount to remove manual entry.
const DEFAULT_SIGN_TX_LAMPORTS = 1000;

const MODAL_TITLES: Record<NonNullable<ModalType>, string> = {
  "sign-message": "Sign Message",
  "sign-tx": "Sign Transaction (SOL transfer)",
  "send-tx": "Send Transaction (SOL transfer)",
  "jupiter-sign": "Jupiter Swap (sign only)",
  "jupiter-swap": "Jupiter Swap (sign & execute)",
};

type ActionGroup = "solana" | "jupiter";

interface ActionButton {
  type: NonNullable<ModalType>;
  icon: ReactNode;
  label: string;
  group: ActionGroup;
}

const ACTIONS: ActionButton[] = [
  {
    type: "sign-message",
    icon: <MessageChat size={24} />,
    label: "Sign Message",
    group: "solana",
  },
  {
    type: "sign-tx",
    icon: <Signature size={24} />,
    label: "Sign TX",
    group: "solana",
  },
  {
    type: "send-tx",
    icon: <ArrowUpRight size={24} />,
    label: "Send TX",
    group: "solana",
  },
  {
    type: "jupiter-sign",
    icon: <Signature size={24} />,
    label: "Sign Swap",
    group: "jupiter",
  },
  {
    type: "jupiter-swap",
    icon: <Exchange size={24} />,
    label: "Sign & Execute",
    group: "jupiter",
  },
];

export function SolanaActionsBlock({
  isConnected,
  canSignMessage,
  canSignTransaction,
  canSendTransaction,
  canJupiterSwap,
  ownAddress,
  onSignMessage,
  onSignTransaction,
  onSendTransaction,
  onJupiterSign,
  onJupiterSwap,
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
          defaultRecipient={ownAddress}
          defaultLamports={DEFAULT_SIGN_TX_LAMPORTS}
          ownAddress={ownAddress}
        />
      ),
      "send-tx": (
        <SolanaTransferModal
          submitLabel="Send Transaction"
          onSubmit={onSendTransaction}
          onClose={closeModal}
          ownAddress={ownAddress}
        />
      ),
      "jupiter-sign": (
        <JupiterSwapModal
          submitLabel="Sign Swap"
          onSubmit={onJupiterSign}
          onClose={closeModal}
        />
      ),
      "jupiter-swap": (
        <JupiterSwapModal
          submitLabel="Sign & Execute Swap"
          onSubmit={onJupiterSwap}
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
    onJupiterSign,
    onJupiterSwap,
    ownAddress,
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

    const isActionDisabled = (type: NonNullable<ModalType>): boolean => {
      switch (type) {
        case "sign-message":
          return !canSignMessage;
        case "sign-tx":
          return !canSignTransaction;
        case "send-tx":
          return !canSendTransaction;
        case "jupiter-sign":
        case "jupiter-swap":
          return !canJupiterSwap;
      }
    };

    const actionTooltip = (
      type: NonNullable<ModalType>,
    ): string | undefined => {
      if (!isActionDisabled(type)) {
        return undefined;
      }
      if (type === "jupiter-sign" || type === "jupiter-swap") {
        return "Jupiter requires mainnet and the solana:signTransaction feature";
      }
      return "This wallet does not support this method";
    };

    const renderActionButton = (action: ActionButton) => {
      const disabled = isActionDisabled(action.type);
      return (
        <button
          key={action.type}
          disabled={disabled}
          className="bg-muted border-muted hover:border-base hover:bg-muted-transparent flex cursor-pointer flex-col items-center rounded-lg border p-16 transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          onClick={() => openModal(action.type)}
          title={actionTooltip(action.type)}
        >
          <span className="text-muted mb-6">{action.icon}</span>
          <span className="body-2-semi-bold text-center text-base leading-tight">
            {action.label}
          </span>
        </button>
      );
    };

    const solanaActions = ACTIONS.filter((action) => action.group === "solana");
    const jupiterActions = ACTIONS.filter(
      (action) => action.group === "jupiter",
    );

    return (
      <div className="space-y-20">
        <div className="space-y-10">
          <h4 className="body-2-semi-bold text-muted tracking-wider uppercase">
            Solana Actions
          </h4>
          <div className="grid grid-cols-3 gap-10">
            {solanaActions.map(renderActionButton)}
          </div>
        </div>

        <div className="space-y-10">
          <h4 className="body-2-semi-bold text-muted tracking-wider uppercase">
            Jupiter API (Swap)
          </h4>
          <p className="body-4 text-muted">
            Swap transactions crafted and broadcast by Jupiter&apos;s Ultra API.
            Mainnet only.
          </p>
          <div className="grid grid-cols-3 gap-10">
            {jupiterActions.map(renderActionButton)}
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
            title={modalType ? MODAL_TITLES[modalType] : ""}
            onClose={closeModal}
          />
          <DialogBody>{modalContent}</DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
