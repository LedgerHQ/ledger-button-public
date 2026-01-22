# Commit Changes

Create a commit following the project's commit message conventions defined in [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Instructions

1. **Check staged changes** - Run `git status` and `git diff --staged` to understand what will be committed.

2. **Gather required information** - Ask the user for:
   - **Scope**: The module/package impacted by the update (e.g., `ledger-button`, `test-dapp`, `docs`)
   - **Description**: A brief description of the change (should start with uppercase)
   - **Type of change**: To determine the appropriate emoji

3. **Commit message format** follows [Conventional Commits](https://www.conventionalcommits.org/) with gitmoji:

   ```
   <emoji> (<scope>): <Description>
   ```

4. **Common gitmoji mappings**:
   | Type | Emoji | Code |
   |------|-------|------|
   | Feature | ✨ | `:sparkles:` |
   | Bug fix | 🐛 | `:bug:` |
   | Refactor | ♻️ | `:recycle:` |
   | Documentation | 📝 | `:memo:` |
   | Tests | ✅ | `:white_check_mark:` |
   | Performance | ⚡ | `:zap:` |
   | Breaking change | 💥 | `:boom:` |
   | Chore/config | 🔧 | `:wrench:` |
   | Dependencies | ⬆️ | `:arrow_up:` |
   | Remove code | 🔥 | `:fire:` |
   | Style/format | 🎨 | `:art:` |
   | Types | 🏷️ | `:label:` |
   | CI | 👷 | `:construction_worker:` |
   | Lint fixes | 🚨 | `:rotating_light:` |

5. **Create the commit**:
   ```bash
   git commit -m "<emoji> (<scope>): <Description>"
   ```

## User Input

If the user provides context after the command (e.g., `/commit fix login button not responding`), use it to:

- Infer the type of change and appropriate emoji
- Extract the description
- Ask only for missing information (like scope if unclear from staged files)

## Validation

Remind the user they can validate commit messages with:

```bash
pnpm danger:local
```

## Tips

- Use `pnpm commit` for an interactive commit prompt
- Keep descriptions concise but descriptive
- One logical change per commit (atomic commits)
