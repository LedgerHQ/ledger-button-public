import { danger, fail, message } from "danger";
import { exit } from "process";

import {
  checkBaseBranch,
  checkBranches,
  checkCommits,
  checkIfBot,
  checkReleasePlanOrNoBumpLabel,
  // checkChangesets,
  checkTitle,
  getAuthor,
  isFork,
} from "./helpers";

const author = getAuthor(danger);
console.log("PR Actor:", author);

const isBot = checkIfBot(danger.github.pr.user);

// Always enforce base-branch rules, even for bot-authored PRs.
const baseBranchResult = checkBaseBranch(danger, fail);

if (isBot) {
  console.log("PR Actor is a bot, skipping checks...");
  if (!baseBranchResult) {
    exit(1);
  }
  exit(0);
}

const results: boolean[] = [];

const fork = isFork(danger.github.pr);

results.push(baseBranchResult);

results.push(checkBranches(danger, fail, fork));

results.push(checkCommits(danger, fail, fork));

results.push(checkTitle(danger, fail, fork));

results.push(checkReleasePlanOrNoBumpLabel(danger, fail));

// results.push(checkChangesets(danger, message));

const successful = results.every((result) => result === true);

if (successful) {
  message("Danger: All checks passed successfully! 🎉", { icon: "✅" });
}
