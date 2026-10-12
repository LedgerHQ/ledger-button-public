import { Config } from "./config";

describe("Config", () => {
  describe("environment and ledger keyring protocol configuration", () => {
    it("should default to production environment", () => {
      const config = new Config({
        originToken: "test-token",
        dAppIdentifier: "test-app",
      });
      expect(config.environment).toBe("production");
      expect(config.lkrp.cloudSyncUrl).toBe(
        "https://cloud-sync-backend.api.aws.prd.ldg-tech.com",
      );
    });

    it.each([
      {
        environment: "production",
        cloudSyncUrl: "https://cloud-sync-backend.api.aws.prd.ldg-tech.com",
        backendUrl: "https://ledgerb.api.ledger.com",
        calUrl: "https://crypto-assets-service.api.ledger.com",
      },
      {
        environment: "staging",
        cloudSyncUrl: "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
        backendUrl: "https://ledgerb.api.ledger-test.com",
        calUrl: "https://crypto-assets-service.api.ledger-test.com",
      },
    ] as const)(
      "should use the expected configuration for $environment",
      ({ environment, cloudSyncUrl, backendUrl, calUrl }) => {
        const config = new Config({
          originToken: "test-token",
          dAppIdentifier: "test-app",
          environment,
        });

        expect(config.environment).toBe(environment);
        expect(config.lkrp.cloudSyncUrl).toBe(cloudSyncUrl);
        expect(config.getBackendUrl()).toBe(backendUrl);
        expect(config.getCalUrl()).toBe(calUrl);
        expect(config.getClearSigningEndpoints()).toBeUndefined();
      },
    );

    it("should allow changing environment after construction", () => {
      const config = new Config({
        originToken: "test-token",
        dAppIdentifier: "test-app",
        environment: "staging",
      });
      expect(config.lkrp.cloudSyncUrl).toBe(
        "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
      );

      config.setEnvironment("production");
      expect(config.environment).toBe("production");
      expect(config.lkrp.cloudSyncUrl).toBe(
        "https://cloud-sync-backend.api.aws.prd.ldg-tech.com",
      );
    });

    it("should maintain other configuration when changing environment", () => {
      const config = new Config({
        originToken: "test-token",
        dAppIdentifier: "test-app",
        environment: "staging",
        logLevel: "debug",
      });

      config.setEnvironment("production");

      expect(config.environment).toBe("production");
      expect(config.logLevel).toBeDefined();
      expect(config.dAppIdentifier).toBe("test-app");
    });
  });

  describe("existing functionality", () => {
    it("should keep production hosts and point clear signing at the connect gateway for trial", () => {
      const trial = new Config({
        originToken: "test-token",
        dAppIdentifier: "test-app",
        environment: "trial",
      });

      expect(trial.environment).toBe("trial");
      expect(trial.lkrp.cloudSyncUrl).toBe(
        "https://cloud-sync-backend.api.aws.prd.ldg-tech.com",
      );
      expect(trial.getBackendUrl()).toBe("https://ledgerb.api.ledger.com");
      expect(trial.getCalUrl()).toBe(
        "https://connect.api.prd.ledger.com/cal",
      );
      expect(trial.getClearSigningEndpoints()).toEqual({
        calUrl: "https://connect.api.prd.ledger.com/cal/v1",
        transactionCheckUrl:
          "https://connect.api.prd.ledger.com/transaction-checks/v3",
      });
    });

    it("should maintain existing configuration options", () => {
      const config = new Config({
        originToken: "custom-token",
        dAppIdentifier: "custom-app",
        logLevel: "warn",
        environment: "production",
      });

      expect(config.originToken).toBe("custom-token");
      expect(config.dAppIdentifier).toBe("custom-app");
      expect(config.logLevel).toBeDefined();
      expect(config.environment).toBe("production");
    });
  });
});
