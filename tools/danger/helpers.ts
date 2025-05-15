// NOTE: we cannot import danger from another module,
// so we need to pass it as argument, only types can be imported
import {
  type GitHubPRDSL,
  type DangerDSLType,
  type MarkdownString,
} from "danger";
import { execSync } from "child_process";

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
        `^(release|chore/backmerge(-.+){0,}|(${BRANCH_PREFIX.join(
          "|"
        )})/(([a-z]{1,})-[0-9]+|no-issue|issue-[0-9]+)-.+)`,
        "i"
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
Please fix the PR branch name to match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/device-sdk-ts/blob/develop/CONTRIBUTING.md).

**Wrong branch name**: \`${currentBranch}\`

ℹ️ Regex to match: \`${this.regex}\`

- Rules:
  - Must start with a type (${BRANCH_PREFIX.join(", ")})
  - Followed by a SLASH ("/")
  - Followed by a description

ℹ️ Example: \`feat/my-feature\`\
`)
      : fail(`\
Please fix the PR branch name to match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/device-sdk-ts/blob/develop/CONTRIBUTING.md).

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
  fork = false
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
One or more commit message does not match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/device-sdk-ts/blob/develop/CONTRIBUTING.md).

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
    return execSync(
      `git log origin/develop..${currentBranch} --pretty=format:%s`
    )
      .toString()
      .split("\n");
  },
});

export const checkCommits = (
  danger: DangerDSLType,
  fail: FailFn,
  fork = false
) => {
  const config = Commits(danger, fail, fork);
  const branchCommits = config.getCommits();
  console.log("Branch commits:", branchCommits);

  const wrongCommits = branchCommits.filter(
    (commit) => !config.regex.test(commit)
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
    : /^.+ \(([a-z]+-?){1,}\) \[(([A-Z]+){1,}-[0-9]+|NO-ISSUE|ISSUE-[0-9]+)\]: [A-Z].*/,

  fail(wrongTitle: string) {
    if (fork) {
      fail(`\
Please fix the PR title to match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/device-sdk-ts/blob/develop/CONTRIBUTING.md).

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
Please fix the PR title to match the convention, see [CONTRIBUTING.md](https://github.com/LedgerHQ/device-sdk-ts/blob/develop/CONTRIBUTING.md).

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
  fork = false
) => {
  const config = Title(danger, fail, fork);
  if (!config.regex.test(danger.github.pr.title)) {
    config.fail(danger.github.pr.title);
    return false;
  }

  return true;
};
