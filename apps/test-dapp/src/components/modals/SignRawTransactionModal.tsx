"use client";

import { useCallback, useRef } from "react";
import { DialogPanel, DialogTitle, Field, Textarea } from "@headlessui/react";

import styles from "../TransactionsBlock.module.css";

interface SignRawTransactionModalProps {
  onSubmit: (rawTx: string) => Promise<void>;
  onClose: () => void;
}

export function SignRawTransactionModal({ onSubmit, onClose }: SignRawTransactionModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const value = textareaRef.current?.value;
    if (!value) {
      return;
    }
    onClose();
    await onSubmit(value);
  }, [onSubmit, onClose]);

  return (
    <DialogPanel transition className={styles["transactions__dialog-panel"]}>
      <DialogTitle as="h3" className={styles["transactions__dialog-title"]}>
        Sign Raw Transaction
      </DialogTitle>
      <Field>
        <Textarea
          ref={textareaRef}
          className={styles["transactions__textarea"]}
          rows={5}
          placeholder="0x..."
        />
      </Field>
      <button
        className={styles["transactions__submit-button"]}
        onClick={handleSubmit}
      >
        Sign Raw TX
      </button>
    </DialogPanel>
  );
}
