# AI Agent Guidelines

AI agents contributing to this repository must follow project conventions.

## Description

Ledger Button is a TypeScript SDK that lets dApps integrate Ledger wallet connection and signing. It is an Nx + pnpm monorepo (`packages/*`, `apps/*`).

## How the AI tooling is wired

All agent instructions live once in [agent-files/](agent-files) and are exposed to each agent via symlinks, so Cursor, Claude Code, and Koda share a single source of truth:

- `agent-files/skills/<name>/SKILL.md` — canonical skills.
- `agent-files/commands/*.md` — canonical slash commands.
- `agent-files/scripts/` — canonical scripts (including Cursor hooks).
- `agent-files/cursor/` and `agent-files/claude/` — per-agent adapter folders that re-expose the canonical files via relative symlinks.
- Top-level dotfiles are symlinks: `.cursor -> agent-files/cursor`, `.claude -> agent-files/claude`, and `.koda/{commands,skills,scripts}` point back into `agent-files/`.

A Cursor rule can be a symlink to a skill's `SKILL.md` (shared frontmatter `name` + `description` + `alwaysApply` satisfies both the skill loader and Cursor's rule engine). Edit content only under `agent-files/`; never edit through the symlinks.

## Documentation

- [README.md](README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md) — branch naming, commits, PRs, version plans.
- [CODING_STANDARDS.md](CODING_STANDARDS.md) — full coding standards.

## Tools

- **pnpm** is the package manager.
- **Nx 22.0.1** orchestrates tasks — always run `build` / `lint` / `test` / `typecheck` / `dev` through `pnpm nx`.
- Use the **`gh`** CLI for GitHub operations (PRs, workflows, comments).

## Skills

Skills activate automatically when the user's request matches a trigger phrase.

| Skill                                              | Trigger                   | Description                                                                                   |
| -------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| [backmerge](agent-files/skills/backmerge/SKILL.md) | `backmerge`, `/backmerge` | Gitflow backmerge of `main` into `develop` after a release.                                   |
| [release](agent-files/skills/release/SKILL.md)     | `release`, `/release`     | End-to-end release: version plans, bump, changelog, release PR against `main`.                |
| [commit](agent-files/skills/commit/SKILL.md)       | `commit`, `/commit`       | Gitmoji + Conventional Commits format for commits, branches, and PR titles (Danger-enforced). |

## Commands

Commands are invoked explicitly by the user (via the command palette or `/` prefix).

| Command                                                        | Description                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| [commit](.cursor/commands/commit.md)                           | Create a commit following gitmoji conventions.                   |
| [backmerge](.cursor/commands/backmerge.md)                     | Run the backmerge workflow.                                      |
| [release](.cursor/commands/release.md)                         | Run the release workflow.                                        |
| [create-branch](.cursor/commands/create-branch.md)             | Create a branch following naming conventions.                    |
| [create-pull-request](.cursor/commands/create-pull-request.md) | Branch + commit + version plan + PR, based on current git state. |
| [setup](.cursor/commands/setup.md)                             | Prepare the workspace and launch the test-dapp.                  |

## Rules

Rules provide context to agents when relevant (not always applied unless noted).

| Rule                                                         | Description                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| [coding-standards.mdc](.cursor/rules/coding-standards.mdc)   | TypeScript, DI, class structure, error handling conventions.          |
| [import-rules.mdc](.cursor/rules/import-rules.mdc)           | Relative-import guidelines (never `src/` paths).                      |
| [i18n-english-only.mdc](.cursor/rules/i18n-english-only.mdc) | Keep new i18n entries in English across all locales.                  |
| [nx-projects.mdc](.cursor/rules/nx-projects.mdc)             | Cached Nx project list and routine targets.                           |
| [nx-rules.mdc](.cursor/rules/nx-rules.mdc)                   | Nx MCP usage guidelines.                                              |
| [commit.mdc](.cursor/rules/commit.mdc)                       | Gitmoji commit/branch/PR conventions (symlinked to the commit skill). |
| [backmerge.mdc](.cursor/rules/backmerge.mdc)                 | Backmerge process (symlinked to the backmerge skill).                 |
| [release.mdc](.cursor/rules/release.mdc)                     | Release process (symlinked to the release skill).                     |

## Cursor Hooks

Hooks run automatically on agent events. Configured in [.cursor/hooks.json](.cursor/hooks.json).

| Hook                                                               | Event           | Description                                                      |
| ------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------- |
| [format.cjs](.cursor/scripts/hooks/format.cjs)                     | `afterFileEdit` | Auto-formats edited files with Prettier.                         |
| [post-task-checks.cjs](.cursor/scripts/hooks/post-task-checks.cjs) | `stop`          | Runs `lint`, `typecheck`, and `test` via Nx on changed projects. |

## Sandbox permissions

The following commands require `required_permissions: ["all"]` because the default sandbox blocks the access they need:

- `pnpm install` / `pnpm i` (post-install scripts, native module builds).
- Any command that calls the GitHub API via `gh` (e.g. `gh pr create`, release/backmerge scripts that fetch PR metadata).
- Deleting or recreating the `.cursor` directory/symlink (the sandbox guards that config path).

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
