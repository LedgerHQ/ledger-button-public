import { GetAddressDAOutput } from "@ledgerhq/device-signer-kit-ethereum";

import type { UserInteractionNeeded } from "../UserInteractionNeeded.js";
import type { SignedResults } from "./SignedTransaction.js";

export type SignType = "transaction" | "typed-message" | "personal-sign";

export type SignFlowStatus =
  | {
      signType: SignType;
      status: "user-interaction-needed";
      interaction: UserInteractionNeeded;
    }
  | {
      signType: SignType;
      status: "success";
      data: SignedResults | GetAddressDAOutput;
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
