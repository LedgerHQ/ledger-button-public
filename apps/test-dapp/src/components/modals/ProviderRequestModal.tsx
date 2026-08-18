"use client";

import { useCallback, useRef, useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
  TextInput,
} from "@ledgerhq/lumen-ui-react";

const PROVIDER_METHODS = [
  // Locally handled
  "eth_accounts",
  "eth_requestAccounts",
  "eth_chainId",
  "eth_sign",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v4",
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_signRawTransaction",
  "eth_sendRawTransaction",
  "wallet_switchEthereumChain",
  // Broadcasted to node
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_estimateGas",
  "eth_call",
  // Not supported by Ledger Button, triggers EIP error result
  "wallet_getCapabilities",
] as const;

interface ProviderRequestModalProps {
  onSubmit: (method: string, params: string) => Promise<void>;
  onClose: () => void;
}

const CUSTOM_METHOD_VALUE = "__custom__";

const METHOD_ITEMS = [
  ...PROVIDER_METHODS.map((m) => ({ value: m, label: m })),
  { value: CUSTOM_METHOD_VALUE, label: "Custom…" },
];

export function ProviderRequestModal({
  onSubmit,
  onClose,
}: ProviderRequestModalProps) {
  const [selectValue, setSelectValue] = useState<string>(PROVIDER_METHODS[0]);
  const [customMethod, setCustomMethod] = useState("");
  const paramsRef = useRef<HTMLTextAreaElement>(null);

  const isCustom = selectValue === CUSTOM_METHOD_VALUE;
  const resolvedMethod = isCustom ? customMethod : selectValue;

  const handleSubmit = useCallback(async () => {
    if (!resolvedMethod) {
      return;
    }
    onClose();
    await onSubmit(resolvedMethod, paramsRef.current?.value || "[]");
  }, [onSubmit, onClose, resolvedMethod]);

  return (
    <div className="space-y-16">
      <div className="space-y-10">
        <Select
          items={METHOD_ITEMS}
          value={selectValue}
          onValueChange={(value) => {
            if (value) {
              setSelectValue(value);
            }
          }}
        >
          <SelectTrigger label="Method" />
          <SelectContent>
            <SelectList
              renderItem={(item) => (
                <SelectItem key={item.value} value={item.value}>
                  <SelectItemText>{item.label}</SelectItemText>
                </SelectItem>
              )}
            />
          </SelectContent>
        </Select>
        {isCustom && (
          <TextInput
            label="Custom method"
            type="text"
            value={customMethod}
            onChange={(e) => setCustomMethod(e.target.value)}
          />
        )}
      </div>

      <div>
        <label className="body-4-semi-bold text-muted mb-6 block">
          Params (JSON array)
        </label>
        <textarea
          ref={paramsRef}
          className="border-muted body-4 bg-muted placeholder:text-muted focus:border-active w-full resize-y rounded-lg border px-12 py-8 font-mono text-base focus:outline-none"
          rows={3}
          placeholder="[]"
        />
      </div>

      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        Call provider.request()
      </Button>
    </div>
  );
}
