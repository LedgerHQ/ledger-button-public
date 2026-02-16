"use client";

import { useCallback, useRef } from "react";
import { DialogPanel, DialogTitle, Field, Textarea } from "@headlessui/react";

import styles from "../TransactionsBlock.module.css";

interface SignTransactionModalProps {
  onSubmit: (tx: string) => Promise<void>;
  onClose: () => void;
}

export function SignTransactionModal({ onSubmit, onClose }: SignTransactionModalProps) {
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
        Sign Transaction
      </DialogTitle>
      <Field>
        <Textarea
          ref={textareaRef}
          className={styles["transactions__textarea"]}
          rows={5}
          placeholder='{"to": "0x...", "value": "0x0", "data": "0x..."}'
        />
      </Field>
      <button
        className={styles["transactions__submit-button"]}
        onClick={handleSubmit}
      >
        Sign Transaction
      </button>
    </DialogPanel>
  );
}
