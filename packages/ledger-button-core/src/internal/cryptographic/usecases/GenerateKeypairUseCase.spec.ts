import {
  Curve,
  KeyPair,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";

import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { GenerateKeypairUseCase } from "./GenerateKeypairUseCase.js";

vi.mock("@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol");

describe("GenerateKeypairUseCase", () => {
  let useCase: GenerateKeypairUseCase;
  let mockLogger: LoggerPublisher;
  let mockCryptoService: NobleCryptoService;
  let mockKeyPair: KeyPair;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    } as unknown as LoggerPublisher;

    mockKeyPair = {
      id: "test-keypair-id",
      getPublicKeyToHex: vi.fn().mockReturnValue("mock-public-key-hex"),
    } as unknown as KeyPair;

    mockCryptoService = {
      createKeyPair: vi.fn().mockResolvedValue(mockKeyPair),
    } as unknown as NobleCryptoService;

    vi.mocked(NobleCryptoService).mockImplementation(() => mockCryptoService);

    useCase = new GenerateKeypairUseCase(() => mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should generate and return a new keypair successfully", async () => {
      const result = await useCase.execute();

      expect(result).toBe(mockKeyPair);
      expect(mockCryptoService.createKeyPair).toHaveBeenCalledWith(Curve.K256);
    });

    it("should throw an error when keypair generation returns null", async () => {
      vi.mocked(mockCryptoService.createKeyPair).mockResolvedValue(
        null as unknown as KeyPair,
      );

      await expect(useCase.execute()).rejects.toThrow("Invalid keypair");
    });
  });
});
