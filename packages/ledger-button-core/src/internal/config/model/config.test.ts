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

    it("should set staging environment correctly", () => {
      const config = new Config({
        originToken: "test-token",
        dAppIdentifier: "test-app",
        environment: "staging",
      });
      expect(config.environment).toBe("staging");
      expect(config.lkrp.cloudSyncUrl).toBe(
        "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
      );
    });

    it("should set production environment correctly", () => {
      const config = new Config({
        originToken: "test-token",
        dAppIdentifier: "test-app",
        environment: "production",
      });
      expect(config.environment).toBe("production");
      expect(config.lkrp.cloudSyncUrl).toBe(
        "https://cloud-sync-backend.api.aws.prd.ldg-tech.com",
      );
    });

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
    it("should point backend URLs at the matching environment host", () => {
      const production = new Config({
        originToken: "test-token",
        dAppIdentifier: "test-app",
        environment: "production",
      });
      expect(production.getBackendUrl()).toBe("https://ledgerb.api.ledger.com");
      expect(production.getCalUrl()).toBe(
        "https://crypto-assets-service.api.ledger.com",
      );
      expect(production.getClearSigningEndpoints()).toBeUndefined();

      const staging = new Config({
        originToken: "test-token",
        dAppIdentifier: "test-app",
        environment: "staging",
      });
      expect(staging.getBackendUrl()).toBe(
        "https://ledgerb.api.ledger-test.com",
      );
      expect(staging.getCalUrl()).toBe(
        "https://crypto-assets-service.api.ledger-test.com",
      );
      expect(staging.getClearSigningEndpoints()).toBeUndefined();
    });

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
        "https://crypto-assets-service.api.ledger.com",
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
