import { bufferToHexaString } from "@ledgerhq/device-management-kit";

import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { DecryptKeypairUseCase } from "./DecryptKeypairUseCase.js";

vi.mock("@ledgerhq/device-management-kit");

describe("DecryptKeypairUseCase", () => {
  let useCase: DecryptKeypairUseCase;
  let mockLogger: LoggerPublisher;
  let mockDecryptionKey: CryptoKey;
  let mockCryptoSubtle: SubtleCrypto;

  const mockIv = new Uint8Array(12).fill(0x42);
  const mockCiphertext = new Uint8Array(16).fill(0xff);
  const mockEncryptedKeypair = new Uint8Array([...mockIv, ...mockCiphertext]);
  const mockDecryptedData = new ArrayBuffer(8);

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    } as unknown as LoggerPublisher;

    mockDecryptionKey = {} as CryptoKey;

    mockCryptoSubtle = {
      decrypt: vi.fn().mockResolvedValue(mockDecryptedData),
    } as unknown as SubtleCrypto;

    global.window = {
      crypto: {
        subtle: mockCryptoSubtle,
      },
    } as unknown as Window & typeof globalThis;

    vi.mocked(bufferToHexaString).mockReturnValue("encrypted-hex");

    useCase = new DecryptKeypairUseCase(() => mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should decrypt an encrypted keypair successfully", async () => {
      const result = await useCase.execute(
        mockEncryptedKeypair,
        mockDecryptionKey,
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.byteLength).toBe(mockDecryptedData.byteLength);
      expect(result.buffer).toBe(mockDecryptedData);
    });

    it("should call decrypt with correct AES-GCM parameters", async () => {
      await useCase.execute(mockEncryptedKeypair, mockDecryptionKey);

      expect(mockCryptoSubtle.decrypt).toHaveBeenCalledWith(
        {
          name: "AES-GCM",
          iv: mockIv,
        },
        mockDecryptionKey,
        mockCiphertext,
      );
    });

    describe.each([
      {
        component: "IV",
        getActual: () => {
          const decryptCall = vi.mocked(mockCryptoSubtle.decrypt).mock
            .calls[0];
          return (decryptCall[0] as AesGcmParams).iv as Uint8Array;
        },
        expectedValue: () => mockIv,
        expectedLength: 12,
      },
      {
        component: "ciphertext",
        getActual: () => {
          const decryptCall = vi.mocked(mockCryptoSubtle.decrypt).mock
            .calls[0];
          return decryptCall[2] as Uint8Array;
        },
        expectedValue: () => mockCiphertext,
        expectedLength: undefined,
      },
    ])(
      "should extract $component correctly",
      ({ getActual, expectedValue, expectedLength }) => {
        beforeEach(async () => {
          await useCase.execute(mockEncryptedKeypair, mockDecryptionKey);
        });

        it("should match expected value", () => {
          const actual = getActual();
          expect(actual).toEqual(expectedValue());
        });

        if (expectedLength !== undefined) {
          it(`should have length ${expectedLength}`, () => {
            const actual = getActual();
            expect(actual.length).toBe(expectedLength);
          });
        }
      },
    );
  });
});
