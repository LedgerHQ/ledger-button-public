# Setup Development Environment

Prepare the local workspace and launch the test-dapp.

## Context for the agent

The workspace is an Nx monorepo. The test-dapp (`apps/test-dapp`) depends on `@ledgerhq/ledger-wallet-provider` (`packages/ledger-button`).

When the user edits files in `packages/ledger-button/src/`, the package must be rebuilt for changes to appear in the test-dapp. Rebuild with:

```bash
pnpm nx build @ledgerhq/ledger-wallet-provider
```

Keep this in mind for the rest of the conversation -- if the user modifies code in the package, trigger a rebuild before checking results.

## Instructions

### 1. Kill existing processes

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null
```

### 2. Update code

Check the current branch. If on `develop`, pull latest. If on a feature branch, fetch and rebase `develop` onto it:

```bash
# On develop:
git pull origin develop

# On a feature branch:
git pull origin develop --rebase
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Build and start

Build all dependencies, then start the dev server:

```bash
pnpm nx dev test-dapp
```

This builds `ledger-button-core` and `ledger-button` (via the `^build` dependency chain), then starts Next.js.

### 5. Confirm

Wait for the Next.js "Ready" message in the terminal output, then let the user know the dev server is running at `http://localhost:3000`.
