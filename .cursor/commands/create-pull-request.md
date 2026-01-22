# Create Pull Request

Create a pull request following the project's PR conventions defined in [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Instructions

### 1. Pre-flight Checks

Before creating the PR, verify:

```bash
# Check current branch and commits
git log --oneline develop..HEAD

# Run linter and type checks
pnpm nx run-many -t lint,typecheck

# Run tests
pnpm nx run-many -t test
```

### 2. Gather Required Information

Ask the user for:
- **Ticket number**: `LBD-<number>`, `ISSUE-<number>`, or `NO-ISSUE`
- **Scope**: The module/package impacted (e.g., `ledger-button`, `test-dapp`)
- **Description**: Brief summary of the changes (starts with uppercase)
- **Type of change**: To determine the appropriate emoji

### 3. PR Title Format

```
<emoji> (<scope>) [<ticket>]: <Description>
```

**Examples:**
- `✨ (ledger-button) [LBD-123]: Add account selection feature`
- `🐛 (test-dapp) [ISSUE-456]: Fix wallet connection timeout`
- `♻️ (docs) [NO-ISSUE]: Refactor API documentation structure`

**Common gitmoji:**
| Type | Emoji |
|------|-------|
| Feature | ✨ |
| Bug fix | 🐛 |
| Refactor | ♻️ |
| Documentation | 📝 |
| Tests | ✅ |
| Performance | ⚡ |
| Breaking change | 💥 |
| Chore/config | 🔧 |

### 4. PR Description Template

Generate a description with:

```markdown
## Summary

<!-- Write a full description of what your pull request is about and why it was needed -->

- <bullet point summarizing main change>
- <additional changes if any>

## Test Plan

<!-- How can reviewers verify this works? -->

- [ ] <test step 1>
- [ ] <test step 2>

## Screenshots/Videos

<!-- Add if relevant, remove section if not applicable -->

## Checklist

- [ ] I have performed a self-review of my code
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have made corresponding changes to the documentation (if applicable)
```

### 5. Create the PR

```bash
# Push branch to remote
git push -u origin HEAD

# Create PR using GitHub CLI
gh pr create --title "<title>" --body "<body>" --base develop
```

## User Input

If the user provides context after the command (e.g., `/create-pull-request LBD-456 add account selection`), use it to:
- Extract ticket number and description
- Infer the type of change
- Analyze commits with `git log --oneline develop..HEAD` to build the summary

## Reminders

- Base branch should be `develop` (unless working on release)
- Ensure branch is rebased on latest `develop`
- Squash/cleanup tiny commits before creating PR
- PR must pass required CI actions
