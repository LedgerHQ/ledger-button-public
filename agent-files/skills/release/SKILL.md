---
name: release
description: End-to-end release workflow to cut and publish a new version (consume version plans, bump versions, update changelogs, open the release PR against main). Use whenever the user asks to do a release, cut a version, publish packages, or invokes /release. Do not improvise the steps — follow this procedure exactly.
alwaysApply: false
---

# Release

End-to-end release workflow.

## Step 1 — Start from a clean develop

Run all of these in parallel:

```bash
git checkout develop
git pull origin develop
git log --oneline origin/main..develop
ls .nx/version-plans/
```

Use the log and version plans output to identify the pending changes and determine the version bump.

## Step 2 — Determine the version

Read every file in `.nx/version-plans/` to find the highest bump across all releasable packages:

| Bump present | SemVer impact |
| ------------ | ------------- |
| `major`      | X+1.0.0       |
| `minor`      | X.Y+1.0       |
| `patch`      | X.Y.Z+1       |

### User input shortcut

If the user provides the version after the command (e.g. `/release 1.2.0`), use that version directly and skip the bump inference.

Otherwise, **ask the user to confirm the version** before proceeding.

## Step 3 — Create the release branch

```bash
git checkout -b release/vX.X.X
```

## Step 4 — Run the release

```bash
pnpm release
```

This triggers:
1. `prerelease` — builds `@ledgerhq/ledger-wallet-provider` and `@ledgerhq/ledger-wallet-provider-core`
2. `nx release` — consumes version plans, bumps package versions, updates changelogs, creates git tags

If the command fails, stop and report the error to the user before continuing.

## Step 5 — Create the Pull Request

### PR title format

```
🔖 (release) [NO-ISSUE]: Release vX.X.X
```

### PR description

Generate the description from the updated changelog entries:

```markdown
## Summary

- Release vX.X.X
- <bullet per notable change extracted from the changelog>

## Checklist

- [ ] Version plans consumed
- [ ] Changelogs updated
- [ ] Packages built successfully
```

### Push and create

```bash
git push -u origin HEAD

gh pr create \
  --title "🔖 (release) [NO-ISSUE]: Release vX.X.X" \
  --body "<body>" \
  --base main
```

> The base branch for release PRs is **`main`**, not `develop`.

Return the PR URL when done.
