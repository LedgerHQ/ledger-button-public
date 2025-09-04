import { SignedTransaction } from "./SignedTransaction.js";

export type SignedTransactionResult =
  | {
      status: "user-interaction-needed";
      interaction:
        | "unlock-device"
        | "allow-secure-connection"
        | "confirm-open-app"
        | "sign-transaction"
        | "allow-list-apps"
        | "web3-checks-opt-in";
    }
  | {
      status: "success";
      data: SignedTransaction;
    }
  | {
      status: "error";
      error: Error;
    }
  | {
      status: "debugging";
      message: string;
    };
