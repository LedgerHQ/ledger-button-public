/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  CommandResultFactory,
  DeviceActionStatus,
} from "@ledgerhq/device-management-kit";
import { Just } from "purify-ts";
import { decode } from "ripple-binary-codec";
import { lastValueFrom } from "rxjs";
import { type Mock } from "vitest";

import { SignXrpTransactionFlowDeviceAction } from "../SignXrpTransactionFlowDeviceAction";
import {
  DEFAULT_ADDRESS,
  DEFAULT_INPUT,
  DER_SIGNATURE,
  makeInternalApiMock,
  PUBLIC_KEY,
  setupOpenAppMock,
} from "./SignXrpTransactionFlowDeviceAction.mock";

vi.mock("@ledgerhq/device-management-kit", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@ledgerhq/device-management-kit")>();
  return {
    ...original,
    OpenAppWithDependenciesDeviceAction: vi.fn(function () {
      return { makeStateMachine: vi.fn() };
    }),
  };
});

/** Length byte followed by the five 32-bit indexes of `44'/144'/0'/0/0`. */
const DERIVATION_PATH_PREFIX_LENGTH = 1 + 5 * 4;

type SentCommand = {
  readonly name: string;
  readonly args: { readonly chunkedData: Uint8Array };
};

/**
 * Runs the real XRP signer kit against a fake transport, to check that the
 * Sign step (fromPromise → makeStateMachine) sends the bytes built after
 * GetAddress.
 */
describe("SignXrpTransactionFlowDeviceAction with the XRP signer kit", () => {
  it("sends the transaction with the device public key to the XRP app", async () => {
    setupOpenAppMock();
    const internalApi = makeInternalApiMock();
    const signChunks: Uint8Array[] = [];
    (internalApi.sendCommand as Mock).mockImplementation(
      async (command: SentCommand) => {
        if (command.name === "GetAddress") {
          return CommandResultFactory({
            data: { address: DEFAULT_ADDRESS, publicKey: PUBLIC_KEY },
          });
        }
        signChunks.push(command.args.chunkedData);
        return CommandResultFactory({ data: Just(DER_SIGNATURE) });
      },
    );

    const da = new SignXrpTransactionFlowDeviceAction({
      input: DEFAULT_INPUT,
    });
    const result = await lastValueFrom(da._execute(internalApi).observable);

    expect(result).toMatchObject({
      status: DeviceActionStatus.Completed,
      output: { signature: DER_SIGNATURE, signingPubKey: PUBLIC_KEY },
    });
    const payload = Buffer.concat(signChunks).subarray(
      DERIVATION_PATH_PREFIX_LENGTH,
    );
    expect(decode(payload.toString("hex"))).toMatchObject({
      Account: DEFAULT_ADDRESS,
      SigningPubKey: PUBLIC_KEY.toUpperCase(),
    });
  });
});
