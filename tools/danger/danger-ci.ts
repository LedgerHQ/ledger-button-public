import { danger, fail, message } from "danger";
import { exit } from "process";

import {
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

const fork = isFork(danger.github.pr);
const isBot = checkIfBot(danger.github.pr.user);

// Always enforce branch naming for the PR base, even for bot-authored PRs.
const branchResult = checkBranches(danger, fail, fork);

if (isBot) {
  console.log("PR Actor is a bot, skipping remaining checks...");
  if (!branchResult) {
    exit(1);
  }
  exit(0);
}

const results: boolean[] = [];

results.push(branchResult);

results.push(checkCommits(danger, fail, fork));

results.push(checkTitle(danger, fail, fork));

results.push(checkReleasePlanOrNoBumpLabel(danger, fail));

// results.push(checkChangesets(danger, message));

const successful = results.every((result) => result === true);

if (successful) {
  message("Danger: All checks passed successfully! 🎉", { icon: "✅" });
}
