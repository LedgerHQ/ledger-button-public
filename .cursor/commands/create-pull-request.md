# Create Pull Request

End-to-end workflow that conditionally handles branch creation, committing, and PR creation based on the current git state. Follows conventions defined in [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Step 0. Assess Current State

Run **all** of these in parallel:

```bash
git branch --show-current
git status
git diff
git diff --staged
git log --oneline develop..HEAD
```

Use the output to determine which phases to execute:

| Current branch | Uncommitted changes? | Commits ahead of develop? | Phases to run |
|---|---|---|---|
| `develop` | yes | — | 1 → 2 → 3 → 4 |
| feature branch | yes | — | 2 → 3 → 4 |
| feature branch | no | yes | 3 → 4 |
| feature branch | no | no | Nothing to do — inform the user |

## Step 1. Gather Shared Information

Before executing any phase, collect the information needed across branch name, commit message, and PR title **once**. Ask the user for anything that cannot be inferred from context or user input:

- **Ticket number**: `LBD-<number>`, `ISSUE-<number>`, or `NO-ISSUE`
- **Type of change**: Determines both the branch prefix and the gitmoji
- **Scope**: The module/package impacted (e.g., `ledger-button`, `test-dapp`, `docs`)
- **Description**: Brief summary (starts with uppercase, will be reused everywhere)

**Type mapping (branch prefix + gitmoji):**

| Type | Branch prefix | Emoji |
|------|--------------|-------|
| Feature | `feat/` | ✨ |
| Bug fix | `bugfix/` | 🐛 |
| Refactor | `refacto/` | ♻️ |
| Documentation | `doc/` | 📝 |
| Tests | `support/` | ✅ |
| Performance | `support/` | ⚡ |
| Chore/config | `chore/` | 🔧 |
| Dependencies | `chore/` | ⬆️ |
| Style/format | `support/` | 🎨 |
| Types | `support/` | 🏷️ |
| CI | `chore/` | 👷 |
| Breaking change | `feat/` | 💥 |
| Remove code | `refacto/` | 🔥 |
| Lint fixes | `support/` | 🚨 |

### User input shortcut

If the user provides context after the command (e.g., `/create-pull-request LBD-456 add account selection feature`), parse it to extract:

- The ticket number (matches `LBD-XXX`, `NO-ISSUE`, or `ISSUE-XXX`)
- The description (remaining text)
- Infer the type of change and emoji from the description and changed files

Only ask for information that cannot be inferred.

## Phase 1 — Create Branch (conditional: only if on `develop`)

Skip this phase if already on a feature branch.

1. Construct the branch name:
   ```
   <branch-prefix>/<ticket-lowercase>-<description-kebab-case>
   ```
   Examples: `feature/lbd-123-add-sparkles`, `refacto/no-issue-remove-sparkles`

2. Create the branch from up-to-date `develop`:
   ```bash
   git pull origin develop
   git checkout -b <branch-name>
   ```

## Phase 2 — Commit (conditional: only if there are uncommitted changes)

Skip this phase if the working tree is clean and staging area is empty.

1. Review changes with `git status` and `git diff` (already done in Step 0).

2. Stage all relevant files:
   ```bash
   git add <files>
   ```

3. Commit using the shared information:
   ```bash
   git commit -m "<emoji> (<scope>): <Description>"
   ```

4. If there are multiple logical changes, create atomic commits for each.

## Phase 3 — Pre-flight Checks

Run before creating the PR:

```bash
git log --oneline develop..HEAD

pnpm nx run-many -t lint,typecheck

pnpm nx run-many -t test
```

If checks fail, fix the issues before proceeding. Do not skip this phase.

## Phase 4 — Create Pull Request

### PR title format

```
<emoji> (<scope>) [<ticket>]: <Description>
```

Examples:

- `✨ (ledger-button) [LBD-123]: Add account selection feature`
- `🐛 (test-dapp) [ISSUE-456]: Fix wallet connection timeout`
- `♻️ (docs) [NO-ISSUE]: Refactor API documentation structure`

### PR description

Generate a description by analyzing all commits with `git log --oneline develop..HEAD`:

````markdown
## Summary

- <bullet point summarizing main change>
- <additional changes if any>

## Test Plan

- [ ] <test step 1>
- [ ] <test step 2>

## Screenshots/Videos

<!-- Add if relevant, remove section if not applicable -->
````

### Push and create

```bash
git push -u origin HEAD

gh pr create --title "<title>" --body "<body>" --base develop
```

## Reminders

- Base branch should be `develop` (unless working on release)
- Ensure branch is rebased on latest `develop`
- Squash/cleanup tiny commits before creating PR
- PR must pass required CI actions
- Validate commit messages with `pnpm danger:local` if in doubt
