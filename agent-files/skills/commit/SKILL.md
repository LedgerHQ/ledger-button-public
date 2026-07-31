---
name: commit
description: Gitmoji + Conventional Commits convention for this repo (commit messages, branch names, and PR titles), enforced by the Danger CI bot. Use whenever creating commits, invoking /commit, naming a branch or PR, or fixing messages that failed Danger.
alwaysApply: false
---

# Commit Changes

Create a commit following the project's gitmoji + Conventional Commits conventions (enforced by `tools/danger/helpers.ts`). This same format applies to **commit messages, branch names, and PR titles**.

## Commit message & PR title format

```
<emoji> (<scope>) [<TICKET>]: <Description>
```

- `<emoji>` — one gitmoji from the table below.
- `<scope>` — lowercase module/package (e.g. `ledger-button`, `ledger-button-core`, `ci`, `release`, `docs`, `version`).
- `[<TICKET>]` — `LBD-<number>` (uppercase in brackets), `NO-ISSUE`, or `ISSUE-<number>`. **Always include it**: Danger only enforces it on PR titles, but the convention is to include it on every commit too so the squash-merge history stays consistent.
- `<Description>` — starts with an uppercase letter.

**Examples** (matching real commits on `develop`):

```
✨ (ledger-button-core) [LBD-563]: Add normalizeAddressForCurrency seam
🐛 (ledger-button) [LBD-560]: Resolve token icons via Ledger CDN
🔖 (version) [LBD-369]: Add version plan
🔧 (release) [NO-ISSUE]: Fix build snapshot workflow
👷 (ci) [NO-ISSUE]: Use SONAR_TOKEN secret
```

## Gitmoji table

| Type | Emoji | Code |
|---|---|---|
| Feature | ✨ | `:sparkles:` |
| Bug fix | 🐛 | `:bug:` |
| Refactor | ♻️ | `:recycle:` |
| Documentation | 📝 | `:memo:` |
| Tests | ✅ | `:white_check_mark:` |
| Performance | ⚡ | `:zap:` |
| Breaking change | 💥 | `:boom:` |
| Chore / config | 🔧 | `:wrench:` |
| Dependencies | ⬆️ | `:arrow_up:` |
| Remove code | 🔥 | `:fire:` |
| Style / format | 🎨 | `:art:` |
| Types | 🏷️ | `:label:` |
| CI | 👷 | `:construction_worker:` |
| Lint fixes | 🚨 | `:rotating_light:` |
| Version plan | 🔖 | `:bookmark:` |

## How to commit (step by step)

1. **Check staged changes** — Run `git status` and `git diff --staged` to understand what will be committed.

2. **Gather required information** — Ask the user for anything that cannot be inferred:
   - **Scope**: the module/package impacted by the update (e.g., `ledger-button`, `test-dapp`, `docs`)
   - **Ticket**: `LBD-<number>`, `ISSUE-<number>`, or `NO-ISSUE`
   - **Description**: a brief description of the change (starts with uppercase)
   - **Type of change**: to determine the appropriate emoji

3. **Create the commit**:

   ```bash
   git commit -m "<emoji> (<scope>) [<TICKET>]: <Description>"
   ```

4. If there are multiple logical changes, create atomic commits for each.

### User input shortcut

If the user provides context after the command (e.g., `/commit fix login button not responding`), use it to:

- Infer the type of change and appropriate emoji
- Extract the description
- Ask only for missing information (like scope if unclear from staged files)

## Branch names

Format: `<prefix>/<ticket-lowercase>-<kebab-description>`

Allowed prefixes (from `BRANCH_PREFIX` in `tools/danger/helpers.ts`): `feature` / `feat`, `bugfix` / `bug` / `hotfix` / `fix`, `support`, `chore` / `core` / `task`, `doc`, `refacto` / `refactor`.

Examples:

- `feat/lbd-369-add-v2-dapp-config-use-case`
- `bugfix/lbd-123-fix-redirect`
- `chore/no-issue-bump-eslint`

## Validation

- `pnpm commit` — interactive commit prompt.
- `pnpm danger:local` — validate branch name + commits + PR title locally.
- Authoritative regexes live in [tools/danger/helpers.ts](../../../tools/danger/helpers.ts); human-readable conventions in [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Tips

- Keep descriptions concise but descriptive.
- One logical change per commit (atomic commits).
