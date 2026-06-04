# Backmerge

Gitflow backmerge workflow. Brings release changes from `main` back into `develop`.

## Step 1 — Determine version

```bash
git checkout main && git pull origin main
```

Read `packages/ledger-button/package.json` → note `version` (e.g. `1.3.0`). This is **`X.X.X`** throughout the rest of this command.

## Step 2 — Create and checkout backmerge branch

The Danger regex for valid branch names is `^(release|backmerge/v.+|...)`. The correct format is:

```
backmerge/vX.X.X
```

```bash
git checkout -b backmerge/vX.X.X
```

## Step 3 — Release plan (pnpm release)

Check whether version plans exist:

```bash
ls .nx/version-plans/
```

If **no version plans exist**, skip to Step 4 — there is nothing to release.

If **version plans exist**, run:

```bash
pnpm release
```

`pnpm release` will:
1. Consume all version plans in `.nx/version-plans/`
2. Bump versions to `X.X.X+1` (e.g. `1.3.0` → `1.3.1`)
3. Prepend a new `## X.X.X+1` section to each `CHANGELOG.md`

**We want version `X.X.X`, not `X.X.X+1`.** Apply corrections immediately after:

### 3a — Fix changelogs

For each `CHANGELOG.md` (`packages/ledger-button/CHANGELOG.md`, `packages/ledger-button-core/CHANGELOG.md`):

- Find the newly generated `## X.X.X+1 (...)` section at the top of the file
- Move **all of its content** (every subsection and bullet) into the existing `## X.X.X (...)` section, appending to the matching subsections (e.g. merge `### 🩹 Fixes` entries into the existing `### 🩹 Fixes` block; create the subsection if it does not exist yet)
- Delete the `## X.X.X+1 (...)` header line

Expected result:

```markdown
## X.X.X (original-date)

### 🚀 Features
- ... (original entries)

### 🩹 Fixes
- ... (original entries)
- <bugfix from version plan 1>        ← appended here
- <bugfix from version plan 2>        ← appended here
```

### 3b — Fix package versions

In `packages/ledger-button/package.json` and `packages/ledger-button-core/package.json`, revert `"version"` from `X.X.X+1` back to `X.X.X`.

### 3c — Amend the nx release commit

```bash
git add packages/ledger-button/CHANGELOG.md \
        packages/ledger-button-core/CHANGELOG.md \
        packages/ledger-button/package.json \
        packages/ledger-button-core/package.json
git commit --amend --no-edit
```

## Step 4 — Open backmerge PR

The Danger title regex requires: `^.+ \(([a-z]+-?)+\)(?: \[(NO-ISSUE|...)\])?: [A-Z].*`

Use this exact title format:

```
🔀 (backmerge) [NO-ISSUE]: Backmerge main X.X.X into develop
```

```bash
git push -u origin HEAD

gh pr create \
  --title "🔀 (backmerge) [NO-ISSUE]: Backmerge main X.X.X into develop" \
  --body "$(cat <<'EOF'
## Summary

- Backmerge \`main\` → \`develop\` for release \`vX.X.X\`
- Merges release changelog entries back into \`develop\`

## Checklist

- [ ] Version plans consumed (if any)
- [ ] Changelogs updated under the \`X.X.X\` section
- [ ] Package versions kept at \`X.X.X\`
EOF
)" \
  --base develop
```

Return the PR URL to the user.

## Step 5 — Merge develop into backmerge branch

```bash
git fetch origin develop
git merge origin/develop
```

**If merge conflicts occur:**
- Stop immediately
- Report the conflicting files to the user
- Ask them to resolve the conflicts, then run `git merge --continue` and push

**If clean merge:**

```bash
git push
```

Confirm the branch is up to date and ready for review.
