"use client";

import { useCallback, useRef } from "react";
import { DialogPanel, DialogTitle, Field, Textarea } from "@headlessui/react";

import styles from "../TransactionsBlock.module.css";

interface SignTypedDataModalProps {
  onSubmit: (typedData: string) => Promise<void>;
  onClose: () => void;
}

export function SignTypedDataModal({ onSubmit, onClose }: SignTypedDataModalProps) {
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
        Sign Typed Data (EIP-712)
      </DialogTitle>
      <Field>
        <Textarea
          ref={textareaRef}
          className={styles["transactions__textarea"]}
          rows={5}
          placeholder='{"types": {...}, "primaryType": "...", "domain": {...}, "message": {...}}'
        />
      </Field>
      <button
        className={styles["transactions__submit-button"]}
        onClick={handleSubmit}
      >
        Sign Typed Data
      </button>
    </DialogPanel>
  );
}
