import { SignedTransaction } from "./SignedTransaction.js";

export type SignType = "transaction" | "typed-message" | "personal-sign";

export type SignFlowStatus =
  | {
      signType: SignType;
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
      signType: SignType;
      status: "success";
      data: SignedTransaction;
    }
  | {
      signType: SignType;
      status: "error";
      error: Error;
    }
  | {
      signType: SignType;
      status: "debugging";
      message: string;
    };
