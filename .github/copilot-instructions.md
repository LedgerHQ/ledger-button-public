# Copilot instructions

Ledger Button is a TypeScript SDK (Nx + pnpm monorepo: `packages/*`, `apps/*`) that lets dApps connect a Ledger wallet and sign. These rules mirror `AGENTS.md` and `CODING_STANDARDS.md`; those files win in case of conflict.

## Review guidelines

- Only comment on real bugs, violations of the rules below, or missing tests for new business logic. Do not suggest rewrites of working code.
- Do not comment on anything already enforced by tooling: formatting (Prettier), import order, `src/` imports, `.js` extensions, unused variables and undeclared dependencies (ESLint), commit messages, branch names and PR titles (Danger).
- Do not ask to translate i18n strings. New keys in `packages/ledger-button/src/i18n/` are intentionally English in every locale file.
- Files under `agent-files/`, `.cursor`, `.claude` and `.koda` are symlinked on purpose; do not flag duplicates.
- Do not flag the absence of comments. Flag useless ones (`// getter`, `// private method`, anything restating the code); comments should explain why, not what.

## TypeScript

- Explicit types on function parameters and return types. No `any`: use `unknown` and narrow, prefer type guards over assertions.
- Prefer `type` over `interface` unless extending or implementing. Use `readonly` for immutable properties.
- Errors and optional values use purify-ts: `Either<Error, T>` for operations that can fail instead of throwing, `Maybe<T>` instead of `T | null | undefined`, `EitherAsync` to compose async work. Call `.extract()` only after `.isRight()` / `.isJust()`, or use `.caseOf()`.
- Prefer `async/await` over raw Promises. Never swallow errors silently.

## Architecture

- Dependency injection uses Inversify: `@injectable()` on classes, `@inject()` in constructors, module types in dedicated `*ModuleTypes.ts` files, `Factory<T>` for dynamic instances.
- Class order: constructor, public methods, getters/setters, private methods. Public methods stay short and read as a sequence of well-named private methods.
- Use cases live in `usecases/` with a single `execute()` method. Services live in `service/`, are injectable and testable.
- One class per file, index files for exports.
- Clean Architecture (ADR 036 and the "Wallet Experience project structure" page): dependencies point inward.
- Each package splits a public `api/` from a private `internal/`, organized by feature. `src/index.ts` only re-exports from `api/`. `internal/` may import `api/`; `api/` must not import `internal/` except explicit type re-exports.
- A feature is one folder under `internal/`, with subfolders only when they have content: `di/` (module and `*ModuleTypes.ts`), `model/`, `use-case/` (required for new features), then `service/` (interface plus `Default…` and optional `Stub…` implementation), `datasource/<externalSystem>/` (interface, `Default…`, DTOs in `<externalSystem>Dtos.ts`), `utils/`. Tests sit next to the file (`Xxx.test.ts`), never in `__tests__/`.
- Folders are kebab-case. Files exporting a class or type are PascalCase, files exporting only functions are camelCase. Use-case classes end with `UseCase`. Interfaces are unprefixed.
- `ledger-button-core` must not import `ledger-wallet-provider-evm` or `-solana`. The UI package (`ledger-button`) is the composition root that passes provider factories to core.
- Provider packages may only use the public types of `ledger-wallet-provider-core`, never its `internal/` paths, and must not import each other.

## Tests

- Vitest, Arrange/Act/Assert, descriptive test names, dependencies mocked through the constructor, public methods tested rather than private ones.
- Bug fixes and new behavior need tests.

## Logging

- Structured logs from a logger created through the logger factory with a descriptive prefix (e.g. `MigrateDatabase Use Case`), at the right level (`info`, `warn`, `error`, `debug`).
