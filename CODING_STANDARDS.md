# Coding Standards

This document outlines the coding standards and best practices for the Ledger Button project. These guidelines help maintain code quality, consistency, and maintainability across the codebase.

## Comments

**Avoid unnecessary comments.** Code should be self-documenting through clear naming and structure. Only add comments when they provide valuable context that the code cannot express.

### ❌ Bad - Useless Comments

```typescript
// Getter
getCurrentVersion(): number {
  return this.storageService.getDbVersion();
}

// Setter
setVersion(version: number): void {
  this.storageService.setDbVersion(version);
}

// Private method
private calculateTotal(): number {
  return this.items.reduce((sum, item) => sum + item.price, 0);
}
```

### ✅ Good - Impactful Comments

```typescript
getCurrentVersion(): number {
  return this.storageService.getDbVersion();
}

setVersion(version: number): void {
  this.storageService.setDbVersion(version);
}

private calculateTotal(): number {
  return this.items.reduce((sum, item) => sum + item.price, 0);
}

/**
 * During the first iteration of the app, the keyPair wasn't encrypted.
 * After a security review it was decided to encrypt the keyPair.
 * This migration ensures existing unencrypted keyPairs are encrypted.
 */
private async migrateToV1(): Promise<void> {
  const keyPairResult = await this.storageService.getKeyPair();
  await this.keyPairMigrationService.migrateKeyPairToEncrypted(keyPairResult);
  this.storageService.setDbVersion(1);
}

// Using a workaround for browser API limitation that doesn't support
// the required encryption algorithm. See: https://github.com/issue/123
private async encryptData(data: Uint8Array): Promise<Uint8Array> {
  // ... implementation
}
```

### When to Comment

- **Explain "why"**, not "what": Business decisions, workarounds, non-obvious reasons
- **Document complex algorithms**: When the logic is intricate and not immediately clear
- **Provide context**: Historical reasons, external dependencies, or constraints
- **JSDoc for public APIs**: Document parameters, return values, and usage examples

### When NOT to Comment

- **Obvious code**: Getters, setters, simple operations
- **Self-explanatory names**: If the code is clear, don't repeat it in comments
- **Outdated information**: Remove comments that no longer apply
- **"What" comments**: The code already shows what it does

## TypeScript Guidelines

### Type Safety

- Always use explicit types for function parameters and return types
- Prefer `type` over `interface` for type aliases (unless extending/implementing)
- Use `readonly` for immutable properties
- Avoid `any` - use `unknown` when the type is truly unknown, then narrow it
- Use type assertions sparingly and prefer type guards

### Dependency Injection

- Use Inversify for dependency injection
- Mark classes with `@injectable()` decorator
- Use `@inject()` for constructor injection
- Store module types in dedicated `*ModuleTypes.ts` files
- Use `Factory<T>` pattern when you need to create instances dynamically

### Class Structure

Classes should follow a specific ordering to improve readability and maintainability:

1. **Constructor** - Dependency injection and initialization
2. **Public methods** - Simple, high-level operations composed of private methods
3. **Getters/Setters** - Property accessors
4. **Private methods** - Implementation details and helper functions

#### Example Structure

```typescript
@injectable()
export class MigrateDbUseCase {
  private logger: LoggerPublisher;

  // 1. Constructor - Dependency injection and initialization
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
  ) {
    this.logger = this.loggerFactory("[MigrateDatabase Use Case]");
  }

  // 2. Public methods - Simple, composed of well-named private functions
  async execute(): Promise<void> {
    const startedVersion = this.getCurrentDbVersion();
    const targetVersion = this.determineTargetVersion(startedVersion);

    if (this.needsMigration(startedVersion, targetVersion)) {
      await this.performMigration(startedVersion, targetVersion);
    }

    this.logger.info(
      `Database migrated from version ${startedVersion} to version ${targetVersion}`,
    );
  }

  // 3. Getters/Setters (if needed)
  getCurrentVersion(): number {
    return this.storageService.getDbVersion();
  }

  // 4. Private methods - Well-named helper functions
  private getCurrentDbVersion(): number {
    return this.storageService.getDbVersion();
  }

  private determineTargetVersion(currentVersion: number): number {
    // Logic to determine target version
    return currentVersion === 0 ? 1 : currentVersion;
  }

  private needsMigration(current: number, target: number): boolean {
    return current < target;
  }

  private async performMigration(
    fromVersion: number,
    toVersion: number,
  ): Promise<void> {
    if (fromVersion === 0 && toVersion === 1) {
      await this.migrateToV1();
    }
  }

  private async migrateToV1(): Promise<void> {
    const keyPairResult = await this.storageService.getKeyPair();
    await this.keyPairMigrationService.migrateKeyPairToEncrypted(keyPairResult);
    this.storageService.setDbVersion(1);
    this.logger.info("Database migrated to version 1");
  }

}
```

#### Testing Example

When testing classes with this structure, focus on testing public methods and their interactions with dependencies. Use dependency injection to mock dependencies and verify behavior.

```typescript
import { Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
const createMockStorageService = () => ({
  getDbVersion: vi.fn(),
  setDbVersion: vi.fn(),
  getKeyPair: vi.fn(),
});

const createMockLogger = () => ({
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
});

const createMockLoggerFactory = (logger: ReturnType<typeof createMockLogger>) =>
  vi.fn(() => logger);

const createMockKeyPairMigrationService = () => ({
  migrateKeyPairToEncrypted: vi.fn(),
});

describe("MigrateDbUseCase", () => {
  let migrateDbUseCase: MigrateDbUseCase;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockLoggerFactory: ReturnType<typeof createMockLoggerFactory>;
  let mockKeyPairMigrationService: ReturnType<
    typeof createMockKeyPairMigrationService
  >;

  beforeEach(() => {
    vi.clearAllMocks();

    // Arrange: Create mocks
    mockStorageService = createMockStorageService();
    mockLogger = createMockLogger();
    mockLoggerFactory = createMockLoggerFactory(mockLogger);
    mockKeyPairMigrationService = createMockKeyPairMigrationService();

    // Create instance with mocked dependencies
    migrateDbUseCase = new MigrateDbUseCase(
      mockLoggerFactory,
      mockStorageService,
      mockKeyPairMigrationService,
    );
  });

  describe("execute", () => {
    it("should migrate from version 0 to version 1", async () => {
      // Arrange
      mockStorageService.getDbVersion.mockReturnValue(0);
      mockStorageService.getKeyPair.mockResolvedValue(
        Right(new Uint8Array([1, 2, 3])),
      );

      // Act
      await migrateDbUseCase.execute();

      // Assert
      expect(mockStorageService.getDbVersion).toHaveBeenCalledTimes(1);
      expect(mockStorageService.setDbVersion).toHaveBeenCalledWith(1);
      expect(mockKeyPairMigrationService.migrateKeyPairToEncrypted).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Database migrated from version 0 to version 1",
      );
    });

    it("should not migrate when already at latest version", async () => {
      // Arrange
      mockStorageService.getDbVersion.mockReturnValue(1);

      // Act
      await migrateDbUseCase.execute();

      // Assert
      expect(mockStorageService.setDbVersion).not.toHaveBeenCalled();
      expect(mockKeyPairMigrationService.migrateKeyPairToEncrypted).not.toHaveBeenCalled();
    });
  });

  describe("getCurrentVersion", () => {
    it("should return the current database version", () => {
      // Arrange
      mockStorageService.getDbVersion.mockReturnValue(2);

      // Act
      const version = migrateDbUseCase.getCurrentVersion();

      // Assert
      expect(version).toBe(2);
      expect(mockStorageService.getDbVersion).toHaveBeenCalledTimes(1);
    });
  });
});
```

#### Testing Best Practices

- **Use AAA pattern**: Arrange, Act, Assert - clearly separate test setup, execution, and verification
- **Mock dependencies**: Use dependency injection to provide test doubles for external dependencies
- **Test public methods**: Focus on testing public API, not private implementation details
- **Use descriptive test names**: Test names should clearly describe the scenario being tested
- **One assertion per test**: When possible, test one behavior per test case for clarity
- **Use beforeEach for setup**: Set up common test fixtures in `beforeEach` to avoid duplication
- **Verify interactions**: Use `toHaveBeenCalledWith()` to verify methods are called with correct arguments
- **Test edge cases**: Include tests for error cases, boundary conditions, and edge cases

#### Key Principles

- **Public methods should be simple**: They read like a story, composed of well-named private functions
- **Private methods should be descriptive**: Their names should clearly explain what they do
- **Each method has a single responsibility**: One method, one clear purpose
- **Use dependency injection in constructors**: Keep constructors focused on setup only
- **Initialize derived properties in constructor body**: Like logger instances created from factories
- **Document complex methods with JSDoc**: Especially public APIs and non-obvious logic

### Naming Conventions

- Use PascalCase for classes, types, and interfaces
- Use camelCase for variables, functions, and methods
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that explain intent
- Prefix private properties with underscore only if necessary for clarity

### Async/Await

- Always use `async/await` instead of raw Promises when possible
- Handle errors appropriately with try/catch
- Return `Promise<void>` for methods that don't return a value
- Use meaningful variable names for async operations

### Error Handling

- Use Result types or throw errors appropriately based on the context
- Log errors with appropriate log levels
- Provide meaningful error messages
- Don't swallow errors silently

### Purify-TS (Functional Programming)

We use [purify-ts](https://gigobyte.github.io/purify/) for functional programming patterns, specifically for error handling and optional values. This library provides type-safe alternatives to throwing errors and using `null`/`undefined`.

#### Either - Error Handling

Use `Either<Error, Success>` for operations that can fail. `Left` represents an error, `Right` represents success.

```typescript
import { Either, Left, Right } from "purify-ts";

// Return types for methods that can fail
async getKeyPair(): Promise<Either<StorageIDBErrors, Uint8Array>> {
  const init = await this.initIdb();

  return new Promise<Either<StorageIDBErrors, Uint8Array>>((resolve) => {
    init.map((db) => {
      // ... operation logic ...
      request.onsuccess = () => {
        resolve(Right(result)); // Success case
      };
      request.onerror = () => {
        resolve(Left(new StorageIDBGetError("Error message"))); // Error case
      };
    });
  });
}

// Using Either values
const result = await storageService.getKeyPair();
if (result.isRight()) {
  const keyPair = result.extract(); // Get the success value
  // Use keyPair...
} else {
  const error = result.extract(); // Get the error
  this.logger.error("Failed to get key pair", { error });
}

// Pattern matching with caseOf
const value = result.caseOf({
  Left: (error) => {
    this.logger.error("Error occurred", { error });
    return defaultValue;
  },
  Right: (data) => data,
});

// Transforming with map
const transformed = result.map((keyPair) => keyPair.length);
```

#### Maybe - Optional Values

Use `Maybe<T>` instead of `T | null | undefined` for optional values. `Just(value)` represents a present value, `Nothing` represents absence.

```typescript
import { Maybe, Just, Nothing } from "purify-ts";

// Return types for optional values
getItem<T>(key: string): Maybe<T> {
  const value = localStorage.getItem(key);
  if (value === null) {
    return Nothing;
  }
  return Just(JSON.parse(value) as T);
}

// Using Maybe values
const account = storageService.getSelectedAccount();
if (account.isJust()) {
  const acc = account.extract(); // Get the value
  // Use account...
}

// Providing defaults
const version = storageService.getItem<number>(STORAGE_KEYS.DB_VERSION)
  .orDefault(0); // Returns 0 if Nothing

// Chaining operations
const result = storageService.getSelectedAccount()
  .map((account) => account.freshAddress)
  .orDefault("unknown");
```

#### EitherAsync - Async Error Handling

Use `EitherAsync` for composing async operations that can fail.

```typescript
import { EitherAsync } from "purify-ts";

private async getFeesFromAlpaca(
  tx: TransactionInfo,
  network: string,
): Promise<GasFeeEstimation | undefined> {
  const result = await EitherAsync(async () => {
    const either = await this.alpacaDataSource.estimateTransactionFee(network, intent);
    return either.caseOf({
      Left: (error) => { throw error; },
      Right: (response) => response
    });
  })
    .map((response) => ({
      gasLimit: response.parameters.gasLimit,
      maxFeePerGas: response.parameters.maxFeePerGas,
    }))
    .ifLeft((error) => {
      this.logger.debug("Estimation failed", { error });
    });

  return result.toMaybe().extract();
}
```

#### Best Practices

- **Use Either for operations that can fail**: Prefer `Either<Error, T>` over throwing exceptions
- **Use Maybe for optional values**: Prefer `Maybe<T>` over `T | null | undefined`
- **Check before extracting**: Always use `.isRight()`, `.isLeft()`, or `.isJust()` before calling `.extract()`
- **Use pattern matching**: Prefer `.caseOf()` for handling both cases explicitly
- **Provide defaults**: Use `.orDefault()` for Maybe values when a fallback is appropriate
- **Transform safely**: Use `.map()` to transform values without unwrapping
- **Compose async operations**: Use `EitherAsync` for chaining async operations that can fail

## Code Organization

### File Structure

- One class per file (unless closely related)
- Use index files for clean exports
- Group related functionality in modules
- Follow domain-driven structure for business logic

### Use Cases Pattern

- Use cases should be in `usecases/` directories
- Use cases should have a single `execute()` method
- Keep use cases focused on a single responsibility
- Use services for shared business logic

### Services

- Services should be in `service/` directories
- Services handle cross-cutting concerns (storage, logging, etc.)
- Services should be injectable and testable

## Code Quality

### Comments

- Write self-documenting code (prefer clear code over comments)
- Only add comments when they provide valuable context that code cannot express
- Use JSDoc for public APIs and complex logic
- Explain "why" not "what" in comments
- Avoid obvious comments (e.g., `// getter`, `// setter`, `// private method`)
- Keep comments up-to-date with code changes
- Remove outdated or redundant comments

### Testing

- Write tests for all business logic
- Use descriptive test names that explain the scenario
- Follow AAA pattern (Arrange, Act, Assert)
- Mock dependencies appropriately

### Performance

- Avoid premature optimization
- Use appropriate data structures
- Be mindful of async operations and avoid blocking
- Consider memory usage for long-running processes

## Import Guidelines

See [Import Rules](.cursor/rules/import-rules.mdc) for detailed import guidelines.

- Always use relative imports instead of absolute imports that start with `src/`
- Group imports: external packages, then internal modules, then relative imports
- Use absolute imports only for workspace packages (e.g., `@ledgerhq/...`)

## Logging

- Use structured logging with context
- Create logger instances with descriptive prefixes (e.g., `[MigrateDatabase Use Case]`)
- Use appropriate log levels (info, warn, error, debug)
- Include relevant context in log messages

## Related Documentation

- [Contributing Guide](./CONTRIBUTING.md) - Git workflow and PR conventions
- [Import Rules](.cursor/rules/import-rules.mdc) - Detailed import guidelines
- [Nx Guidelines](.cursor/rules/nx-rules.mdc) - Nx workspace conventions
