---
name: write-tutorial
description: Guide for writing tutorials following the Diátaxis framework. Use when the user wants to write or improve a tutorial—a learning-oriented, lesson-style document that teaches by doing under the tutor's guidance.
source: https://diataxis.fr/tutorials/
metadata:
  document_type: tutorial
  framework: diataxis
---

# Tutorial Writing (Diátaxis)

**Instructions:** Use this skill by (1) confirming the document type with the user if unclear, (2) applying the Structure section below to draft or restructure, (3) before finishing, running through [CHECKLIST.md](CHECKLIST.md). When editing docs in this project, follow the **doc-conventions** rule for frontmatter and invariants (the rule applies when `docs/` files are open). Use this skill for structure and the **voice-and-style** skill for tone and vocabulary. When the tutorial describes **this project's** APIs, config, or workflows, use the **project's code** (e.g. search the project for symbols, paths, and runnable examples) so steps and outcomes match the implementation.

**Content integrity rule:** Only write content you can verify from the project's codebase, the user-provided input, or an authoritative external source. If information is missing, incomplete, or ambiguous, insert a `[TODO: verify — <what's missing>]` placeholder and flag it for the author. Never invent, assume, or fabricate technical details, API signatures, behavior, parameters, or background context to fill gaps.

Use this when writing **tutorials**: learning-oriented, lesson-style documentation where the reader learns by doing, under your guidance. The goal is **acquisition of skills and knowledge**, not completing a one-off task.

For examples, see [EXAMPLES.md](EXAMPLES.md) when needed.

## When to Use This Type

- The reader is **learning**; they may not know the product or workflow yet.
- You are acting as **tutor**: you choose what they learn, what they do, and you take responsibility for their success.
- The outcome is **confidence and familiarity** (names of things, workflows, concepts), not just a finished artifact.

## Structure

1. **Introduction**
   - State what the learner will **achieve** by the end (the concrete outcome). Use this template: *"In this tutorial, we will [concrete action]. By the end, we will have [specific artifact or result]."*
   - Do **not** say "you will learn…" or "this tutorial covers…"; show the achievable goal as something done, not something understood.
   - Indicate if the tutorial builds on other documents; link to prerequisites.
   - One optional "What you'll learn" bullet list (4–5 items) helps set expectations and maps to the steps.

2. **Steps (concrete, ordered)**
   - One clear action per step; ideally 5 or fewer steps per section to manage cognitive load.
   - Each step must produce a **visible, meaningful result** the learner can verify.
   - After key steps: briefly state what the learner should see (e.g. *"The output should look something like…"*, *"Notice that…"*).
   - If something might go wrong: say so (e.g. *"If the output doesn't show X, you have probably forgotten to…"*).

3. **Conclusion**
   - Describe what the learner has accomplished (mild, positive framing). Template: *"You have [past-tense concrete accomplishment]."*
   - Link to next steps, how-to guides, or explanation as needed. Template: *"Next: [link — label], [link — label]."*
   - Keep the conclusion to 2–3 sentences. Do not introduce new concepts or steps.

## Diátaxis Principles

- **Don't try to teach by explaining.** Provide an experience; let learning happen by doing.
- **Deliver visible results early and often.** Every step should have a comprehensible result.
- **Maintain a narrative of the expected.** Tell the learner what they should see; reduce anxiety.
- **Point out what to notice.** Close the loop (e.g. *"Notice that…"*, *"Remember that…"*).
- **Minimise explanation.** One short sentence (e.g. *"We're using HTTPS because it's more secure"*) plus a link to explanation is enough.
- **Focus on the concrete.** This problem, this action, this result. Avoid abstraction and options.
- **Ignore options and alternatives.** One path to success; leave other choices for how-to or reference.
- **Aim for reliability.** The tutorial should work for every user, every time; test and fix gaps.

## Language

- Use **"we"** throughout — not just in the introduction. Frame all actions as joint: *"In this tutorial, we will…"*, *"First, let's…"*, *"Now, let's…"*, *"Let's verify…"*, *"We should now see…"*
- Use **imperatives with "we" framing**: introduce each action with "we" or "let's", then give the imperative verb: *"First, let's install the package."* *"Now, let's create the connection."* *"Let's check the output."*
- Do **not** use "you" for actions the learner takes; use "we" instead. ❌ *"You should now install…"* ✓ *"Let's now install…"* ❌ *"Now that you have done y, do z."* ✓ *"Now that we have done y, let's do z."*
- Set expectations: *"The output should look something like…"*, *"You should see…"*
- Confirm progress: *"Notice that…"*, *"Let's check…"*
- Describe achievement: *"You have built…"* (brief, positive).

## What to Avoid

- Long explanations, theory, or conceptual digressions (link to explanation instead).
- Multiple options or "you can also…" (save for how-to or reference).
- Steps with no visible outcome or no way to verify success.
- Assumptions that the reader already knows the product or workflow.
