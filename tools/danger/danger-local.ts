import { danger, message, fail } from "danger";
import { checkBranches, checkCommits, getAuthor } from "./helpers";

const author = getAuthor(danger);
console.log("PR Actor:", author);

const results: boolean[] = [];

results.push(checkBranches(danger, fail));

results.push(checkCommits(danger, fail));

const successful = results.every((result) => result === true);

if (successful) {
  message("Danger: All checks passed successfully! 🎉", { icon: "✅" });
}
