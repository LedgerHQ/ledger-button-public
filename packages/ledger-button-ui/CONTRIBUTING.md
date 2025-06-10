# Contributing

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This file will guide you through the local setup and contains the guidelines you will need
to follow to get your code merged.

## Disclaimer

While you explore these projects, here are some key points to keep in mind:

- Follow the git workflow, prefix your branches and do not create unnecessary merge commits.
- Be mindful when creating Pull Requests, clearly specify the purpose of your changes and include tests where applicable.

## Guidelines

### Important Steps

**Before submitting a pull request, please make sure the following is done:**

1. Make sure you have cloned the repository locally and use `develop` as base branch (unless working on release stuff)
2. Make your changes.
3. If you’ve fixed a bug or added code that should be tested, add tests!
4. Make sure you follow the gitmoji convention for the commit message.
5. Make sure that the code passes linter and type checks (`pnpm nx run-many -t lint,typecheck`).
6. Make sure the code passes unit and end to end tests (`pnpm nx run-many test`).
7. Cleanup your branch - unless it contains merge commits (perform atomic commits, squash tiny commits…).

### Git Conventions

We use the following git conventions for the `Ledger Button` monorepo.

#### Branch naming

Depending on the purpose every git branch should be prefixed.

- `feat/` / `feature/` Add a new feature to the application or library
- `bugfix/` / `bug/` / `fix/` Fixing an existing bug
- `support/` For any other changes (tests, improvements, CI…)
- `chore/` / `core/`  For  maintenance work on the repo
- `doc/` Add or modify documentation
- `refacto/` / `refactor/` Modify the code organisation

_For Ledger Employees only:_ Add the Jira ticket number `LBD-<number>` _(case insensitive)_ or `NO-ISSUE` if not applicable.

_If resolving a Github issue (optional and not to be combined with Jira ticket number):_ add `ISSUE-<number>`

Followed by a small description.

**Examples:**

| Ticket | Example |
| -- | -- |
| yes | feature/lbd-123-add-sparkles |
| no | refacto/no-issue-remove-sparkles |


#### Changelogs

Changelog are automatically generated based on the commit history.

#### Commit message

We use the standard [**Conventional Commits**](https://www.conventionalcommits.org/) specification.

The format is similar to gitmoji:

<emoji> (<scope>): <description>

- scope is the module/package that is impacted by the update.
- `<description>` should start with an uppercase.

You should use the `pnpm commit` prompt to ensure that your commit messages are valid, as well as the `pnpm danger:local` command to check that every commit on your current branch are valid.

#### Rebase & Merge strategies

The rule of thumb is to **always favour rebasing** as long as your branch does not contain merge commits.

For instance:

- bugfix branches that are small and self-contained should always get rebased on top of `develop`.
- feature branches should always get rebased on top of `develop`.

### Pull Request Conventions

Follow the next step to fill the PR template

#### Title

The description format is similar to gitmoji:

<emoji> (<scope>) [NO-ISSUE]: <description>

1. scope is the module/package that is impacted by the update (should be the same than the commit ones).
2. `NO-ISSUE` to be replace by `LBD-<number>` or `ISSUE-<number>` in case of tracking
3. `<description>` should start with an uppercase.

#### Description

- Write a full description of what your pull request is about and why it was needed.
- Add some screenshots or videos if relevant.
- Do not forget to fill the checklist

### Workflow

- Github actions will trigger depending on which part of the codebase is impacted.
- Your PR must pass the required CI actions.