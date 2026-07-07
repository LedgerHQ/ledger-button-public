"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";

import { fetchSupportedDapps, type SupportedDapp } from "../../lib/cal";
import {
  fetchLatestUnsignedRawTxForContract,
  fetchRandomUnsignedRawTx,
} from "../../lib/etherscan";

interface SignRawTransactionModalProps {
  onSubmit: (rawTx: string) => Promise<void>;
  onClose: () => void;
  apiKey: string;
}

export function SignRawTransactionModal({
  onSubmit,
  onClose,
  apiKey,
}: SignRawTransactionModalProps) {
  const [value, setValue] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [dapps, setDapps] = useState<SupportedDapp[]>([]);
  const [isLoadingDapps, setIsLoadingDapps] = useState(false);
  const [dappsError, setDappsError] = useState<string | null>(null);
  const [selectedDappId, setSelectedDappId] = useState<string>("");
  const [targetContract, setTargetContract] = useState<string | null>(null);
  const [dappQuery, setDappQuery] = useState("");

  const filteredDapps = useMemo(() => {
    const query = dappQuery.trim().toLowerCase();
    if (!query) {
      return dapps;
    }
    return dapps.filter((dapp) => dapp.id.toLowerCase().includes(query));
  }, [dapps, dappQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingDapps(true);
    setDappsError(null);
    fetchSupportedDapps(apiKey)
      .then((result) => {
        if (!cancelled) {
          setDapps(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDappsError(
            err instanceof Error ? err.message : "Failed to load dApps",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDapps(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const handleFetchRandom = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    setHash(null);
    setTargetContract(null);
    try {
      const { rawTx, hash: txHash } = await fetchRandomUnsignedRawTx();
      setValue(rawTx);
      setHash(txHash);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transaction",
      );
    } finally {
      setIsFetching(false);
    }
  }, []);

  const handleSelectDapp = useCallback(
    async (dappId: string) => {
      setSelectedDappId(dappId);
      const dapp = dapps.find((d) => d.id === dappId);
      const contract = dapp?.contracts[0];
      if (!contract) {
        return;
      }
      setIsFetching(true);
      setError(null);
      setHash(null);
      setTargetContract(contract);
      try {
        const { rawTx, hash: txHash } =
          await fetchLatestUnsignedRawTxForContract(contract);
        setValue(rawTx);
        setHash(txHash);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch transaction",
        );
      } finally {
        setIsFetching(false);
      }
    },
    [dapps],
  );

  const handleSubmit = useCallback(async () => {
    if (!value) {
      return;
    }
    onClose();
    await onSubmit(value);
  }, [onSubmit, onClose, value]);

  return (
    <div className="space-y-16">
      <div className="space-y-8">
        <Select
          value={selectedDappId}
          onValueChange={handleSelectDapp}
          onOpenChange={(open) => {
            if (!open) {
              setDappQuery("");
            }
          }}
          disabled={isLoadingDapps || dapps.length === 0}
        >
          <SelectTrigger
            label={
              isLoadingDapps
                ? "Loading supported dApps..."
                : "Supported dApp (clear sign)"
            }
          />
          <SelectContent>
            <div className="p-8">
              <SearchInput
                placeholder="Search dApps..."
                value={dappQuery}
                onChange={(event) => setDappQuery(event.target.value)}
                onClear={() => setDappQuery("")}
                onKeyDown={(event) => event.stopPropagation()}
              />
            </div>
            {filteredDapps.length === 0 ? (
              <p className="body-4 text-muted px-8 py-4">No dApps found</p>
            ) : (
              filteredDapps.map((dapp) => (
                <SelectItem key={dapp.id} value={dapp.id}>
                  <SelectItemText>{dapp.id}</SelectItemText>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {dappsError && <p className="body-4 text-error">{dappsError}</p>}
        {targetContract && (
          <p className="body-4 text-muted break-all">
            Target contract: {targetContract}
          </p>
        )}
      </div>

      <div className="space-y-8">
        <textarea
          className="border-muted body-2 bg-muted placeholder:text-muted focus:border-active w-full resize-y rounded-lg border px-12 py-8 font-mono text-base focus:outline-none"
          rows={5}
          placeholder="0x..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {hash && (
          <p className="body-4 text-muted break-all">
            Source tx:{" "}
            <a
              href={`https://etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {hash}
            </a>
          </p>
        )}
        {error && <p className="body-4 text-error">{error}</p>}
      </div>
      <div className="space-y-8">
        <Button
          appearance="gray"
          size="md"
          isFull
          disabled={isFetching}
          onClick={handleFetchRandom}
        >
          {isFetching ? "Fetching..." : "Random tx (Etherscan)"}
        </Button>
        <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
          Sign Raw TX
        </Button>
      </div>
    </div>
  );
}
