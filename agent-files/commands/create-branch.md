# Create Branch

Create a new git branch following the project's branch naming conventions defined in [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Instructions

1. **Gather required information** - Ask the user for:
   - **Ticket number**: Jira ticket (e.g., `LBD-123`) or `NO-ISSUE` if not applicable. For GitHub issues, use `ISSUE-<number>`.
   - **Branch type**: What kind of change is this?
     - `feat/` or `feature/` - Add a new feature
     - `bugfix/` or `fix/` - Fix an existing bug
     - `support/` - Other changes (tests, improvements, CI…)
     - `chore/` - Maintenance work
     - `doc/` - Documentation
     - `refacto/` or `refactor/` - Code reorganization
   - **Short description**: A brief kebab-case description of the change

2. **Construct the branch name** using the format:
   ```
   <type>/<ticket>-<description>
   ```
   
   Examples:
   - `feature/lbd-123-add-sparkles`
   - `refacto/no-issue-remove-sparkles`
   - `bugfix/issue-456-fix-login-error`

3. **Verify the base branch** - The branch should be created from `develop` (unless working on release stuff).

4. **Create the branch** by running:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b <branch-name>
   ```

## User Input

If the user provides context after the command (e.g., `/create-branch LBD-456 add account selection feature`), parse it to extract:
- The ticket number (if it matches `LBD-XXX`, `NO-ISSUE`, or `ISSUE-XXX`)
- The description (remaining text, converted to kebab-case)

If information is missing, ask for clarification before proceeding.
