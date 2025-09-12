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
    | "accounts"
    | "sign-tx"
    | "send-tx"
    | "sign-raw-tx"
    | "sign-typed-data"
    | "sign-personal-message"
    | null
  >(null);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const txRef = useRef<HTMLTextAreaElement>(null);
  const sendTxRef = useRef<HTMLTextAreaElement>(null);
  const rawTxRef = useRef<HTMLTextAreaElement>(null);
  const typedDataRef = useRef<HTMLTextAreaElement>(null);
  const personalMessageRef = useRef<HTMLTextAreaElement>(null);
  const [result, setResult] = useState<string | null>(null);

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

  const startSignTransaction = useCallback(() => {
    setResult(null);
    setError(null);
    setModalType("sign-tx");
    setIsOpen(true);
  }, []);

  const startSendTransaction = useCallback(() => {
    setResult(null);
    setError(null);
    setModalType("send-tx");
    setIsOpen(true);
  }, []);

  const startSignTypedData = useCallback(() => {
    setResult(null);
    setError(null);
    setModalType("sign-typed-data");
    setIsOpen(true);
  }, []);

  const startSignRawTransaction = useCallback(() => {
    setResult(null);
    setError(null);
    setModalType("sign-raw-tx");
    setIsOpen(true);
  }, []);

  const startSignPersonalMessage = useCallback(() => {
    setResult(null);
    setError(null);
    setModalType("sign-personal-message");
    setIsOpen(true);
  }, []);

  const handleSignTransaction = useCallback(async () => {
    if (!selectedProvider || !txRef.current?.value) return;
    setResult(null);
    setIsOpen(false);
    setError(null);

    const tx = JSON.parse(txRef.current.value);
    console.log("JSON RPC eth_signTransaction TX ", tx);
    try {
      const result = (await selectedProvider.provider.request({
        method: "eth_signTransaction",
        params: [tx],
      })) as string;
      setResult(result);
      console.log({ result });
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(error as string);
      }
    }
  }, [selectedProvider]);

  const handleSendTransaction = useCallback(async () => {
    if (!selectedProvider || !sendTxRef.current?.value) return;
    setResult(null);
    setIsOpen(false);
    setError(null);

    if (!sendTxRef.current?.value) return;
    try {
      const transx = JSON.parse(sendTxRef?.current?.value);
      console.log("JSON RPC eth_sendTransaction TX ", transx);

      const result = (await selectedProvider.provider.request({
        method: "eth_sendTransaction",
        params: [transx],
      })) as string;
      setResult(result);
      console.log({ result });
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(error as string);
      }
    }
  }, [selectedProvider]);

  const handleSignTypedData = useCallback(async () => {
    if (!selectedProvider || !typedDataRef.current?.value) return;
    setResult(null);
    setIsOpen(false);
    setError(null);

    if (!typedDataRef.current?.value) return;
    try {
      const typedData = JSON.parse(typedDataRef.current.value);
      const result = (await selectedProvider.provider.request({
        method: "eth_signTypedData_v4",
        params: [account, typedData],
      })) as string;
      console.log({ result });
      setResult(result);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(error as string);
      }
    }
  }, [selectedProvider, account]);

  const handleSignPersonalMessage = useCallback(async () => {
    console.log("handleSignPersonalMessage eth_sign");
    if (!selectedProvider || !personalMessageRef.current?.value) return;
    setResult(null);
    setIsOpen(false);
    setError(null);

    if (!personalMessageRef.current?.value) return;

    try {
      console.log(
        "handleSignPersonalMessage trying to use request({ method: 'eth_sign' })",
      );
      const result = (await selectedProvider.provider.request({
        method: "eth_sign",
        params: [account, personalMessageRef.current.value],
      })) as string;
      console.log("handleSignPersonalMessage result", { result });
      setResult(result);
    } catch (error) {
      console.log("handleSignPersonalMessage error", error);
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(error as string);
      }
    }
    console.log("handleSignPersonalMessage end");
  }, [selectedProvider, account]);

  const handleDisconnect = useCallback(async () => {
    if (!selectedProvider) return;

    if (Provider && selectedProvider.provider instanceof Provider) {
      console.log("disconnecting from eip1193 provider");
      selectedProvider.provider.disconnect();
    }

    setSelectedProvider(null);
    setAccount(null);
    setResult(null);
    setError(null);
    setModalType(null);
    setIsOpen(false);
  }, [selectedProvider, setSelectedProvider]);

  const handleSignRawTransaction = useCallback(async () => {
    if (!selectedProvider || !rawTxRef.current?.value) return;
    setResult(null);
    setIsOpen(false);
    setError(null);
    console.log("JSON RPC eth_signRawTransaction TX ", rawTxRef.current.value);
    const transx = ethers.Transaction.from(rawTxRef.current.value);
    console.log("JSON RPC eth_signRawTransaction Ethers Transaction", {
      transx,
    });
    try {
      const result = (await selectedProvider.provider.request({
        method: "eth_signRawTransaction",
        params: [transx],
      })) as string;
      console.log({ transaction: result });
      setResult(result);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(error as string);
      }
    }
  }, [selectedProvider]);

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
            {/* <button onClick={handleGetBalance}>Get Balance</button> */}
            <button onClick={startSignTransaction}>Sign Transaction</button>
            <button onClick={startSignRawTransaction}>
              Sign Raw Transaction
            </button>
            <button onClick={startSendTransaction}>Send Transaction</button>
            <button onClick={startSignTypedData}>Sign Typed Data</button>
            <button onClick={startSignPersonalMessage}>
              Sign Personal Message
            </button>
          </div>
        )}

        {(error || result) && (
          <div className={styles.metadata}>
            {result && <div className={styles.result}>{result}</div>}
            {error && <div className={styles.error}>{error}</div>}
          </div>
        )}

        <Dialog
          open={isOpen}
          as="div"
          className={styles.dialog}
          onClose={() => setIsOpen(false)}
        >
          <div className={styles.dialogWrapper}>
            <div className={styles.dialogContent}>
              {/* ACCOUNTS */}
              {modalType === "accounts" && (
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
              )}

              {/* SIGN TX */}
              {modalType === "sign-tx" && (
                <DialogPanel transition className={styles.dialogPanel}>
                  <DialogTitle as="h3" className={styles.dialogTitle}>
                    Sign Transaction
                  </DialogTitle>
                  <Field>
                    <Textarea
                      ref={txRef}
                      className={styles.textarea}
                      rows={3}
                    />
                  </Field>
                  <button onClick={handleSignTransaction}>Sign TX</button>
                </DialogPanel>
              )}

              {/* SEND TX */}
              {modalType === "send-tx" && (
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
              )}

              {/* SIGN RAW TX */}
              {modalType === "sign-raw-tx" && (
                <DialogPanel transition className={styles.dialogPanel}>
                  <DialogTitle as="h3" className={styles.dialogTitle}>
                    Raw TX
                  </DialogTitle>
                  <Field>
                    <Textarea
                      ref={rawTxRef}
                      className={styles.textarea}
                      rows={3}
                    />
                  </Field>
                  <button onClick={handleSignRawTransaction}>
                    Sign Raw TX
                  </button>
                </DialogPanel>
              )}

              {/* SIGN TYPED DATA */}
              {modalType === "sign-typed-data" && (
                <DialogPanel transition className={styles.dialogPanel}>
                  <DialogTitle as="h3" className={styles.dialogTitle}>
                    Typed Data (JSON)
                  </DialogTitle>
                  <Field>
                    <Textarea
                      ref={typedDataRef}
                      className={styles.textarea}
                      rows={3}
                    />
                  </Field>
                  <button onClick={handleSignTypedData}>Sign Typed Data</button>
                </DialogPanel>
              )}

              {/* SIGN PERSONAL MESSAGE */}
              {modalType === "sign-personal-message" && (
                <DialogPanel transition className={styles.dialogPanel}>
                  <DialogTitle as="h3" className={styles.dialogTitle}>
                    Personal Message
                  </DialogTitle>
                  <Field>
                    <Textarea
                      ref={personalMessageRef}
                      className={styles.textarea}
                      rows={3}
                    />
                  </Field>
                  <button onClick={handleSignPersonalMessage}>
                    Sign Personal Message
                  </button>
                </DialogPanel>
              )}
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
