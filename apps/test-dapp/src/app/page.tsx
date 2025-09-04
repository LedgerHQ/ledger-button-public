"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  Textarea,
} from "@headlessui/react";
import { ethers } from "ethers";

import { useProviders } from "../hooks/useProviders";

import styles from "./page.module.css";

let Provider:
  | typeof import("@ledgerhq/ledger-button").LedgerEIP1193Provider
  | null = null;

export default function Index() {
  const { providers, selectedProvider, setSelectedProvider } = useProviders();
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "accounts" | "sign" | "send" | null
  >(null);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const txRef = useRef<HTMLTextAreaElement>(null);
  const sendTxRef = useRef<HTMLTextAreaElement>(null);

  const dispatchRequestProvider = useCallback(() => {
    if (typeof window === "undefined") return;

    import("@ledgerhq/ledger-button").then((module) => {
      Provider = module.LedgerEIP1193Provider;
    });

    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setModalType("accounts");
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!selectedProvider) return;

    // Type assertion for the specific event handler
    const handleAccountsChanged = (accounts: string[]) => {
      setIsOpen(false);
      setAccount(accounts[0]);
    };

    selectedProvider.provider.on("accountsChanged", handleAccountsChanged);

    return () => {
      selectedProvider.provider.removeListener(
        "accountsChanged",
        handleAccountsChanged,
      );
    };
  }, [selectedProvider]);

  useEffect(() => {
    if (selectedProvider) {
      setIsOpen(false);
    }
  }, [selectedProvider]);

  const handleRequestAccounts = useCallback(async () => {
    if (!selectedProvider) return;

    setError(null);

    try {
      const accounts = (await selectedProvider?.provider.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[];
      if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error(error);
      setError((error as Error)?.message ?? "Unknown error");
    }
  }, [selectedProvider, account]);

  const handleGetBalance = useCallback(async () => {
    if (!selectedProvider) return;

    setError(null);

    try {
      const balance = (await selectedProvider.provider.request({
        method: "eth_getBalance",
        params: [],
      })) as { result?: string; error?: { code: number; message: string } };

      console.log(balance);
      setBalance(balance.result ?? "");
      if (balance.error) {
        setError(balance.error.message);
      }
    } catch (error) {
      setError(error as string);
      console.error(error);
    }
  }, [selectedProvider]);

  const startSignTransaction = useCallback(() => {
    setModalType("sign");
    setIsOpen(true);
  }, []);

  const startSendTransaction = useCallback(() => {
    setModalType("send");
    setIsOpen(true);
  }, []);

  const handleSignTransaction = useCallback(async () => {
    if (!selectedProvider || !txRef.current?.value) return;
    setIsOpen(false);
    setError(null);

    const transx = ethers.Transaction.from(txRef.current.value);

    try {
      const transaction = (await selectedProvider.provider.request({
        method: "eth_signTransaction",
        params: [transx],
      })) as string;
      console.log(transaction);
    } catch (error) {
      console.error(error);
    }
  }, [selectedProvider]);

  const handleSendTransaction = useCallback(async () => {
    if (!selectedProvider || !sendTxRef.current?.value) return;
    setIsOpen(false);
    setError(null);

    if (!sendTxRef.current?.value) return;
    try {
      const tx = JSON.parse(sendTxRef?.current?.value);
      console.log(tx);
      tx.from = undefined;
      const transx = ethers.Transaction.from(tx);

      const transaction = (await selectedProvider.provider.request({
        method: "eth_sendTransaction",
        params: [transx],
      })) as string;
      console.log(transaction);
    } catch (error) {
      console.error(error);
    }
  }, [selectedProvider]);

  const handleDisconnect = useCallback(async () => {
    if (!selectedProvider) return;

    if (Provider && selectedProvider.provider instanceof Provider) {
      console.log("disconnecting from eip1193 provider");
      selectedProvider.provider.disconnect();
    }

    setSelectedProvider(null);
    setAccount(null);
    setBalance("");
    setError(null);
    setModalType(null);
    setIsOpen(false);
  }, [selectedProvider, setSelectedProvider]);

  return (
    <div className={styles.page}>
      <div className="wrapper">
        {account && (
          <div className={styles.account}>
            <p>Account: {account}</p>
          </div>
        )}

        <div className={styles.metadata}>
          {selectedProvider && (
            <img
              src={selectedProvider.info.icon}
              alt={selectedProvider.info.name}
            />
          )}
          <p>
            {selectedProvider?.provider.isConnected()
              ? "Connected"
              : "Not Connected"}
          </p>
          <button onClick={dispatchRequestProvider}>List Providers</button>
          {selectedProvider && (
            <>
              <button onClick={handleRequestAccounts}>Request Accounts</button>
              <button onClick={handleDisconnect}>Disconnect</button>
            </>
          )}
        </div>

        {account && (
          <div className={styles.metadata}>
            <span>BALANCE: {balance}</span>
            <button onClick={handleGetBalance}>Get Balance</button>
            <button onClick={startSignTransaction}>Sign Transaction</button>
            <button onClick={startSendTransaction}>Send Transaction</button>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <Dialog
          open={isOpen && modalType === "accounts"}
          as="div"
          className={styles.dialog}
          onClose={() => setIsOpen(false)}
        >
          <div className={styles.dialogWrapper}>
            <div className={styles.dialogContent}>
              <DialogPanel transition className={styles.dialogPanel}>
                <DialogTitle as="h3" className={styles.dialogTitle}>
                  Available Providers
                </DialogTitle>
                <div className={styles.providers}>
                  {providers.map((data) => (
                    <div
                      className={styles.provider}
                      key={data.info.uuid}
                      onClick={() => setSelectedProvider(data)}
                    >
                      <p>{data.info.name}</p>
                      <img src={data.info.icon} alt={data.info.name} />
                    </div>
                  ))}
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>

        <Dialog
          open={isOpen && modalType === "sign"}
          as="div"
          className={styles.dialog}
          onClose={() => setIsOpen(false)}
        >
          <div className={styles.dialogWrapper}>
            <div className={styles.dialogContent}>
              <DialogPanel transition className={styles.dialogPanel}>
                <DialogTitle as="h3" className={styles.dialogTitle}>
                  Raw TX
                </DialogTitle>
                <Field>
                  <Textarea ref={txRef} className={styles.textarea} rows={3} />
                </Field>
                <button onClick={handleSignTransaction}>Sign</button>
              </DialogPanel>
            </div>
          </div>
        </Dialog>

        <Dialog
          open={isOpen && modalType === "send"}
          as="div"
          className={styles.dialog}
          onClose={() => setIsOpen(false)}
        >
          <div className={styles.dialogWrapper}>
            <div className={styles.dialogContent}>
              <DialogPanel transition className={styles.dialogPanel}>
                <DialogTitle as="h3" className={styles.dialogTitle}>
                  JSON TX
                </DialogTitle>
                <Field>
                  <Textarea
                    ref={sendTxRef}
                    className={styles.textarea}
                    rows={3}
                  />
                </Field>
                <button onClick={handleSendTransaction}>
                  Send Transaction
                </button>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
