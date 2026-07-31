"use client";

import { useCallback, useMemo, useState } from "react";
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

import {
  getJupiterTokenByMint,
  JUPITER_TOKENS,
  type JupiterSwapValues,
} from "../jupiter";

const TOKEN_ITEMS = JUPITER_TOKENS.map((token) => ({
  value: token.mint,
  label: token.symbol,
}));

interface JupiterSwapModalProps {
  onSubmit: (values: JupiterSwapValues) => Promise<void>;
  onClose: () => void;
  submitLabel: string;
}

interface SwapPreset {
  label: string;
  inputMint: string;
  outputMint: string;
  amount: number;
}

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const PRESETS: SwapPreset[] = [
  {
    label: "0.001 SOL → USDC",
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: 1_000_000,
  },
  {
    label: "0.01 SOL → USDC",
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: 10_000_000,
  },
  {
    label: "1 USDC → SOL",
    inputMint: USDC_MINT,
    outputMint: SOL_MINT,
    amount: 1_000_000,
  },
];

export function JupiterSwapModal({
  onSubmit,
  onClose,
  submitLabel,
}: JupiterSwapModalProps) {
  const [inputMint, setInputMint] = useState(SOL_MINT);
  const [outputMint, setOutputMint] = useState(USDC_MINT);
  const [amount, setAmount] = useState("1000000");
  const [error, setError] = useState<string | null>(null);

  const inputToken = useMemo(
    () => getJupiterTokenByMint(inputMint),
    [inputMint],
  );

  const applyPreset = useCallback((preset: SwapPreset) => {
    setInputMint(preset.inputMint);
    setOutputMint(preset.outputMint);
    setAmount(String(preset.amount));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    const parsed = Number.parseInt(amount, 10);
    if (inputMint === outputMint) {
      setError("Input and output tokens must differ.");
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Amount must be a positive integer (base units).");
      return;
    }
    setError(null);
    onClose();
    await onSubmit({ inputMint, outputMint, amount: parsed });
  }, [onSubmit, onClose, inputMint, outputMint, amount]);

  return (
    <div className="space-y-16">
      <div className="space-y-8">
        <h4 className="body-4-semi-bold text-muted tracking-wider uppercase">
          Quick presets
        </h4>
        <div className="grid grid-cols-1 gap-8">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              appearance="gray"
              size="sm"
              isFull
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        <Select
          value={inputMint}
          onValueChange={(value) => setInputMint(value ?? "")}
          items={TOKEN_ITEMS}
        >
          <SelectTrigger label="You pay" />
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
        <Select
          value={outputMint}
          onValueChange={(value) => setOutputMint(value ?? "")}
          items={TOKEN_ITEMS}
        >
          <SelectTrigger label="You receive" />
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
      </div>

      <TextInput
        label={`Amount (base units${inputToken ? ` of ${inputToken.symbol}` : ""})`}
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="1000000"
      />
      {inputToken && (
        <p className="body-4 text-muted">
          {inputToken.symbol} has {inputToken.decimals} decimals (1{" "}
          {inputToken.symbol} = {10 ** inputToken.decimals} base units).
        </p>
      )}

      {error && (
        <div className="border-error bg-error-transparent rounded-lg border p-12">
          <code className="body-4 text-error font-mono">{error}</code>
        </div>
      )}

      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}
