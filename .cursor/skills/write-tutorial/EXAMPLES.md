# Tutorial Examples

Add short examples of good tutorials here. Load this file when the user asks for a sample or when you need a concrete pattern.

## Example 1: Minimal structure

**Title:** Build your first API (concrete outcome, not "Learn about APIs")

1. **Introduction** — "In this tutorial we will build a small REST API that returns the current time. By the end you will have a running service and know how to call it."
2. **Steps** — One action per step; each step has a visible result (e.g. "You should see…"). No "you can also…"; one path only.
3. **Conclusion** — "You have built and tested your first endpoint. Next: [how-to add authentication], [explanation: how APIs fit in our architecture]."

Use the same pattern: achievable goal up front, ordered steps with visible results, brief positive conclusion, links to how-to/explanation.

---

## Example 2: Technical tutorial (code-heavy, layered steps)

Use this when the tutorial teaches by doing with code: each step has runnable examples and a clear outcome. The structure below is drawn from a beginner tutorial that teaches device communication (sending commands, using pre-defined commands, then device actions).

### What makes it work

- **Intro = concrete outcome** — Title states the task ("Exchange data with the device"). First paragraph: what they'll do and what they'll understand by the end. No vague "learn about"; clear achievement.
- **What you'll learn** — Short bullet list that mirrors the steps (APDU, pre-defined commands, device actions, user interactions). Sets expectations and gives skimmers a map.
- **Prerequisites** — Explicit list with links to previous tutorials (setup, init, connect). One line: "You should have X and Y." Learner can qualify before starting.
- **Steps in order of abstraction** — Step 1: lowest level (raw APDU). Step 2: higher level (pre-defined commands). Step 3: highest level (device actions). One path; complexity grows with the lesson.
- **One concept per step, sub-examples allowed** — Step 2 can group several small operations (open app, close app, get OS, get app) under one idea ("pre-defined commands"). Each sub-part has code + what they get. Keeps the narrative "we're now using commands" while showing variety.
- **Visible results** — Every code block leads to something the learner can run and observe (response, console output, state). Where helpful, a tip or callout points out what to notice (e.g. "This information is also available in device session state").
- **Error handling callout** — Before or inside a step: short block ("Most commands will reject if: device locked, or status ≠ success") and what to check. Reduces anxiety without turning into a how-to.
- **Conclusion = recap + next steps** — "What you've learned" bullet list (mirrors "What you'll learn"). "Next steps" with 2–3 links: sample app, how-to (e.g. build custom commands), or explanation. Positive, forward-looking.

### Structure mapping (Diátaxis)

| Section in doc | Diátaxis role |
|----------------|---------------|
| Title + first paragraph | **Introduction** — achievable goal, what they'll understand by the end |
| What you'll learn | **Introduction** — set expectations, map to steps |
| Prerequisites | **Introduction** — qualify the learner, link to prior tutorials |
| Step 1, 2, 3… | **Steps** — ordered, one path; each step has code and visible result |
| Error handling / Tip callouts | **Steps** — what might go wrong, what to notice |
| What you've learned | **Conclusion** — recap accomplishment |
| Next steps | **Conclusion** — links to how-to, reference, sample |

### Patterns to reuse

- **"What you'll learn" list** — 4–5 bullets that mirror the step titles. Helps learner see the arc and skim.
- **Prerequisites block** — "Before starting: [link], [link], [link]. You should have X and Y."
- **Layered steps** — Order by level of abstraction (low-level → high-level) or dependency so each step builds on the previous.
- **Step = one concept, multiple sub-examples** — One step can contain several short code blocks (e.g. open app, close app, get version) if they share one idea. Each block is runnable and has a clear outcome.
- **Minimal explanation in steps** — One sentence of context before code (e.g. "APDU commands are the low-level protocol…"). No long theory; link to explanation if needed.
- **Error handling callout** — Before a step or after first code: "Most X will fail if: condition 1, condition 2. Check Y." Keeps tutorial reliable.
- **Tip callout** — "This information is also available in Z" or "Notice that…" to close the loop without digressing.
- **Conclusion mirror** — "What you've learned" repeats the intro list in past tense. Then "Next steps" with labeled links (e.g. "Check out the sample app", "Learn how to build custom commands").

When writing or reviewing a tutorial, compare: Is the goal stated as an achievable outcome? Do steps run in one order with visible results? Is there a short recap and clear next-step links? Are prerequisites and error cases called out so the path is reliable?
