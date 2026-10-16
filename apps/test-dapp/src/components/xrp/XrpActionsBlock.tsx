"use client";

import { useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

import { type PaymentValues } from "./xrpNode";

const INPUT_CLASS =
  "border border-muted rounded-lg bg-canvas px-12 py-8 body-2 text-base w-full font-mono";

interface XrpActionsBlockProps {
  address: string | null;
  isBusy: boolean;
  onSign: (values: PaymentValues) => void;
  onSignMessage: (message: string) => void;
  onSignAndSubmit: (values: PaymentValues) => void;
}

export function XrpActionsBlock({
  address,
  isBusy,
  onSign,
  onSignMessage,
  onSignAndSubmit,
}: XrpActionsBlockProps) {
  const [destination, setDestination] = useState("");
  const [amountDrops, setAmountDrops] = useState("1");
  const [message, setMessage] = useState("Hello from Ledger Button");

  const values: PaymentValues = {
    destination: destination || (address ?? ""),
    amountDrops,
  };
  const disabled = !address || isBusy;

  return (
    <>
      <div className="border-muted bg-canvas rounded-lg border p-20">
        <span className="body-2-semi-bold text-muted mb-12 block tracking-wider uppercase">
          Payment
        </span>
        <p className="body-2 text-error mb-14">
          This talks to XRPL mainnet. Sign only is safe; Sign &amp; submit
          broadcasts a real transaction.
        </p>

        <label className="body-2 text-muted mb-4 block">
          Destination (defaults to your own address)
        </label>
        <input
          className={INPUT_CLASS}
          value={destination}
          placeholder={address ?? "Connect first"}
          onChange={(event) => setDestination(event.target.value)}
        />

        <label className="body-2 text-muted mt-12 mb-4 block">
          Amount (drops, 1 XRP = 1,000,000)
        </label>
        <input
          className={INPUT_CLASS}
          value={amountDrops}
          inputMode="numeric"
          onChange={(event) => setAmountDrops(event.target.value)}
        />

        <div className="mt-16 flex gap-12">
          <Button
            appearance="accent"
            size="md"
            disabled={disabled}
            onClick={() => onSign(values)}
          >
            Sign
          </Button>
          <Button
            appearance="red"
            size="md"
            disabled={disabled}
            onClick={() => onSignAndSubmit(values)}
          >
            Sign &amp; submit
          </Button>
        </div>
      </div>

      <div className="border-muted bg-canvas rounded-lg border p-20">
        <span className="body-2-semi-bold text-muted mb-12 block tracking-wider uppercase">
          Sign message
        </span>
        <p className="body-2 text-muted mb-14">
          XRPL has no message signing: the device signs a non-submittable
          AccountSet that carries the message in a Memo.
        </p>
        <input
          className={INPUT_CLASS}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="mt-16">
          <Button
            appearance="accent"
            size="md"
            disabled={disabled || message === ""}
            onClick={() => onSignMessage(message)}
          >
            Sign message
          </Button>
        </div>
      </div>
    </>
  );
}
