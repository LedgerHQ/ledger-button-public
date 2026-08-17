// NOTE: we cannot import danger from another module,
// so we need to pass it as argument, only types can be imported
import { execFileSync, execSync } from "child_process";
import {
  type DangerDSLType,
  type GitHubPRDSL,
  type MarkdownString,
} from "danger";

type FailFn = (message: MarkdownString, file?: string, line?: number) => void;

export const BRANCH_PREFIX = [
  "feature",
  "feat",
  "bugfix",
  "bug",
  "hotfix",
  "fix",
  "support",
  "chore",
  "core",
  "task",
  "doc",
  "refacto",
  "refactor",
];

export const checkIfBot = (user: GitHubPRDSL["user"]) => user.type === "Bot";

export const getAuthor = (danger: DangerDSLType) => {
  if (danger.github) {
    return danger.github.pr.user.login;
  }

  return execSync("git log -1 --pretty=format:'%an'").toString().trim();
};

export const isFork = (pr: GitHubPRDSL) => pr?.head?.repo?.fork ?? false;

const Branch = (danger: DangerDSLType, fail: FailFn, isFork = false) => ({
  regex: isFork
    ? new RegExp(`^(${BRANCH_PREFIX.join("|")})/.+`, "i")
    : new RegExp(
        `^(release|backmerge/v.+|(${BRANCH_PREFIX.join(
          "|",
        )})/(([a-z]{1,})-[0-9]+|noissue|no-issue|issue-[0-9]+)-.+)`,
        "i",
      ),

  getBranch: () => {
    if (danger.github) {
      return danger.github.pr.head.ref;
    }

    return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  },

  fail(currentBranch: string) {
    return isFork
      ? fail(`\
Please fix the PR branch name to match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/ledger-button/blob/develop/CONTRIBUTING.md).

**Wrong branch name**: \`${currentBranch}\`

ℹ️ Regex to match: \`${this.regex}\`

- Rules:
  - Must start with a type (${BRANCH_PREFIX.join(", ")})
  - Followed by a SLASH ("/")
  - Followed by a description

ℹ️ Example: \`feat/my-feature\`\
`)
      : fail(`\
Please fix the PR branch name to match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/ledger-button/blob/develop/CONTRIBUTING.md).

**Wrong branch name**: \`${currentBranch}\`

ℹ️ Regex to match: \`${this.regex}\`

- Rules:
  - Must start with a type (${BRANCH_PREFIX.join(", ")})
  - Followed by a SLASH ("/")
  - Followed by a JIRA issue number (bttn-1234) or "no-issue" or "issue-1234" if fixing a Github issue
  - Followed by a DASH ("-")
  - Followed by a description

ℹ️ Example: \`feat/bttn-1234-my-feature\`\
`);
  },
});

export const checkBranches = (
  danger: DangerDSLType,
  fail: FailFn,
  fork = false,
) => {
  const config = Branch(danger, fail, fork);
  const currentBranch = config.getBranch();
  console.log("Current branch:", currentBranch);
  if (!config.regex.test(currentBranch)) {
    config.fail(currentBranch);
    return false;
  }

  return true;
};

const Commits = (danger: DangerDSLType, fail: FailFn, fork = false) => ({
  regex: /^.+\s\(([a-zA-Z]+-?){1,}\)(\s\[(NO-ISSUE|([A-Z]+-\d+))\])?: [A-Z].*/,

  fail(wrongCommits: string[]) {
    fail(`\
One or more commit message does not match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/ledger-button/blob/develop/CONTRIBUTING.md).

**Wrong commit messages**:
${wrongCommits.map((commit) => `• \`${commit}\``).join("\n")}

ℹ️ Regex to match: \`${this.regex}\`

- Rules:
  - Must start with an emoji (gitmoji compliant)
  - Followed by a SPACE
  - Followed by a scope in parentheses and in LOWERCASE
  - _Optional_
    - Followed by a SPACE
    - Followed by a JIRA issue number in brackets [BTTN-1234] or [NO-ISSUE]
  - Followed by a colon (":") and a SPACE
  - Followed by a <ins>C</ins>apitalized message

Example: \`💚 (scope): My feature\`\

Special case for commit messages coming from a pull request merge:
 - \`💚 (scope) [BTTN-1234]: My feature\`\
 - \`💚 (scope) [NO-ISSUE]: My title\`\

 You can use \`pnpm commit\` to help you write commit messages following the convention.
`);
  },

  getCommits: () => {
    if (danger.github) {
      return danger.github.commits.map(({ commit }) => commit.message);
    }

    const currentBranch = Branch(danger, fail, fork).getBranch();
    return execFileSync("/usr/bin/git", [
      "log",
      `origin/develop..${currentBranch}`,
      "--pretty=format:%s",
    ])
      .toString()
      .split("\n");
  },
});

export const checkCommits = (
  danger: DangerDSLType,
  fail: FailFn,
  fork = false,
) => {
  const config = Commits(danger, fail, fork);
  const branchCommits = config.getCommits();
  console.log("Branch commits:", branchCommits);

  const wrongCommits = branchCommits.filter(
    (commit) => !config.regex.test(commit),
  );

  if (wrongCommits.length > 0) {
    config.fail(wrongCommits);
    return false;
  }

  return true;
};

const Title = (_danger: DangerDSLType, fail: FailFn, fork = false) => ({
  regex: fork
    ? /^.+ \(([a-z]+-?){1,}\): [A-Z].*/
    : /^.+ \(([a-z]+-?){1,}\)(?: \[(([A-Z]+){1,}-[0-9]+|NO-ISSUE|ISSUE-[0-9]+)\])?: [A-Z].*/,

  fail(wrongTitle: string) {
    if (fork) {
      fail(`\
Please fix the PR title to match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/ledger-button/blob/develop/CONTRIBUTING.md).

**Wrong PR title**: \`${wrongTitle}\`

ℹ️ Regex to match: \`${this.regex}\`
- Rules:
  - Must start with an emoji matching the Gitmoji convention
  - Followed by a SPACE
  - Followed by a scope in parentheses and in LOWERCASE
  - _Optional_
    - _Followed by a SPACE_
    - _Followed by ISSUE-<number> to reference a Github issue_
  - Followed by a colon (":") and a SPACE
  - Followed by a <ins>C</ins>apitalized message

ℹ️ Example: \`✨ (scope): My feature\`\
`);
    } else {
      fail(`\
Please fix the PR title to match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/ledger-button/blob/develop/CONTRIBUTING.md).

**Wrong PR title**: \`${wrongTitle}\`

ℹ️ Regex to match: \`${this.regex}\`

- Rules:
  - Must start with a word (usually an emoji)
  - Followed by a SPACE
  - Followed by a scope in parentheses and in LOWERCASE
  - Followed by a SPACE
  - Followed by a JIRA issue number BTTN-<number> or NO-ISSUE or ISSUE-<number> in [brackets] (uppercase)
  - Followed by a colon (":") and a SPACE
  - Followed by a <ins>C</ins>apitalized message

ℹ️ Example: \`✨ (scope) [BTTN-1234]: My feature\`\
`);
    }
  },
});

export const checkTitle = (
  danger: DangerDSLType,
  fail: FailFn,
  fork = false,
) => {
  const config = Title(danger, fail, fork);
  if (!config.regex.test(danger.github.pr.title)) {
    config.fail(danger.github.pr.title);
    return false;
  }

  return true;
};

const RELEASABLE_PACKAGE_PATHS = [
  "packages/ledger-button/",
  "packages/ledger-button-core/",
];

const VERSION_PLAN_PATH_PREFIX = ".nx/version-plans/";

const isIgnoredForPlanCheck = (filePath: string) =>
  filePath.endsWith(".spec.ts") ||
  filePath.endsWith(".test.ts") ||
  filePath.endsWith(".stories.tsx") ||
  filePath.endsWith(".stories.ts") ||
  filePath.includes("/.storybook/");

const touchesReleasableSourceFile = (filePath: string) =>
  RELEASABLE_PACKAGE_PATHS.some((packagePath) =>
    filePath.startsWith(packagePath),
  ) && !isIgnoredForPlanCheck(filePath);

const isVersionPlanFile = (filePath: string) =>
  filePath.startsWith(VERSION_PLAN_PATH_PREFIX) && filePath.endsWith(".md");

type PullRequestLabel = { name: string };
type PullRequestWithLabels = GitHubPRDSL & {
  labels?: PullRequestLabel[];
};

const hasNoBumpLabel = (danger: DangerDSLType) => {
  const pullRequest = danger.github.pr as PullRequestWithLabels;
  const labels = pullRequest.labels?.map(({ name }) => name) ?? [];
  return labels.includes("release:no-bump");
};

const RELEASE_BRANCH_PREFIXES = ["release/", "backmerge/", "hotfix/"];

const isReleaseBranch = (danger: DangerDSLType) => {
  const branch = danger.github
    ? danger.github.pr.head.ref
    : execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  return RELEASE_BRANCH_PREFIXES.some((prefix) => branch.startsWith(prefix));
};

const ALLOWED_BASE_MAIN_PREFIXES = ["release/v", "hotfix/"];

export const checkBaseBranch = (danger: DangerDSLType, fail: FailFn) => {
  const baseBranch = danger.github.pr.base.ref;
  if (baseBranch !== "main") {
    return true;
  }

  const headBranch = danger.github.pr.head.ref;
  const isAllowed = ALLOWED_BASE_MAIN_PREFIXES.some((prefix) =>
    headBranch.startsWith(prefix),
  );

  if (!isAllowed) {
    fail(`\
PRs targeting \`main\` are only allowed from \`release/vX.X.X\` or \`hotfix/*\` branches.

**Current branch**: \`${headBranch}\`

If this is a release, rename your branch to \`release/vX.X.X\`. If this is a hotfix, rename it to \`hotfix/<jira-or-no-issue>-<description>\`.\
`);
    return false;
  }

  return true;
};

export const checkReleasePlanOrNoBumpLabel = (
  danger: DangerDSLType,
  fail: FailFn,
) => {
  if (isReleaseBranch(danger)) {
    return true;
  }

  const changedFiles = [
    ...danger.git.created_files,
    ...danger.git.modified_files,
    ...danger.git.deleted_files,
  ];

  const touchesReleasableFiles = changedFiles.some(touchesReleasableSourceFile);
  if (!touchesReleasableFiles) {
    return true;
  }

  const hasVersionPlan = changedFiles.some(isVersionPlanFile);
  if (hasVersionPlan || hasNoBumpLabel(danger)) {
    return true;
  }

  fail(`\
This PR touches releasable packages (\`packages/ledger-button\` or \`packages/ledger-button-core\`) but has no release intent marker.

Please add one of:
- a version plan file in \`.nx/version-plans/\`
- the label \`release:no-bump\` for changes that should not bump version

This keeps release intent explicit and prevents accidental missing release metadata.\
`);

  return false;
};
